/**
 * Offline Context - Manages offline state, download queue, and sync
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerServiceWorker } from '@/lib/offline/serviceWorker';
import {
  getAllMaterialsMetadata,
  downloadAndSaveMaterial,
  removeMaterial,
  getStorageUsage,
  getLocalVersions,
  getFile,
  updateLastAccessed,
  getPendingSyncItems,
  MaterialMetadata,
} from '@/lib/offline/indexedDB';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DownloadProgress {
  materialId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

interface OfflineContextType {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  downloadedMaterials: MaterialMetadata[];
  downloadProgress: Map<string, DownloadProgress>;
  storageUsage: { used: number; materials: number };
  updatesAvailable: Map<string, number>; // materialId -> new version
  pendingSyncCount: number;
  downloadMaterial: (material: LearningMaterial) => Promise<boolean>;
  removeMaterialOffline: (id: string) => Promise<void>;
  getMaterialFile: (id: string) => Promise<Blob | null>;
  checkForUpdates: () => Promise<void>;
  refreshDownloadedMaterials: () => Promise<void>;
}

interface LearningMaterial {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  version: number;
  subjects?: { name: string } | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [downloadedMaterials, setDownloadedMaterials] = useState<MaterialMetadata[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [storageUsage, setStorageUsage] = useState({ used: 0, materials: 0 });
  const [updatesAvailable, setUpdatesAvailable] = useState<Map<string, number>>(new Map());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();

  // Update pending sync count
  const refreshPendingSyncCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncItems();
      setPendingSyncCount(pending.length);
    } catch (error) {
      console.error('Error getting pending sync count:', error);
    }
  }, []);

  // Initialize service worker
  useEffect(() => {
    registerServiceWorker().then((registration) => {
      if (registration) {
        setIsServiceWorkerReady(true);
      }
    });
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back Online',
        description: 'Your internet connection has been restored.',
      });
      checkForUpdates();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Offline Mode',
        description: 'You are now offline. Downloaded materials are still accessible.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load downloaded materials on mount
  useEffect(() => {
    refreshDownloadedMaterials();
  }, []);

  const refreshDownloadedMaterials = useCallback(async () => {
    try {
      const materials = await getAllMaterialsMetadata();
      setDownloadedMaterials(materials);
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error('Error loading downloaded materials:', error);
    }
  }, []);

  const downloadMaterial = useCallback(async (material: LearningMaterial): Promise<boolean> => {
    const materialId = material.id;

    // Set initial progress
    setDownloadProgress((prev) => {
      const next = new Map(prev);
      next.set(materialId, { materialId, progress: 0, status: 'downloading' });
      return next;
    });

    try {
      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('learning-materials')
        .getPublicUrl(material.file_url);

      const fileUrl = urlData.publicUrl;

      const success = await downloadAndSaveMaterial(
        {
          id: material.id,
          title: material.title,
          description: material.description,
          subjectId: material.subject_id,
          subjectName: material.subjects?.name || 'Unknown',
          fileUrl: material.file_url,
          fileName: material.file_name,
          fileSize: material.file_size,
          fileType: material.file_type,
          version: material.version,
        },
        fileUrl
      );

      if (success) {
        setDownloadProgress((prev) => {
          const next = new Map(prev);
          next.set(materialId, { materialId, progress: 100, status: 'completed' });
          return next;
        });

        await refreshDownloadedMaterials();

        toast({
          title: 'Download Complete',
          description: `"${material.title}" is now available offline.`,
        });

        // Clear progress after a delay
        setTimeout(() => {
          setDownloadProgress((prev) => {
            const next = new Map(prev);
            next.delete(materialId);
            return next;
          });
        }, 2000);

        return true;
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading material:', error);

      setDownloadProgress((prev) => {
        const next = new Map(prev);
        next.set(materialId, { materialId, progress: 0, status: 'failed' });
        return next;
      });

      toast({
        title: 'Download Failed',
        description: `Could not download "${material.title}". Please try again.`,
        variant: 'destructive',
      });

      return false;
    }
  }, [refreshDownloadedMaterials, toast]);

  const removeMaterialOffline = useCallback(async (id: string): Promise<void> => {
    try {
      await removeMaterial(id);
      await refreshDownloadedMaterials();
      toast({
        title: 'Material Removed',
        description: 'The material has been removed from offline storage.',
      });
    } catch (error) {
      console.error('Error removing material:', error);
      toast({
        title: 'Error',
        description: 'Could not remove the material.',
        variant: 'destructive',
      });
    }
  }, [refreshDownloadedMaterials, toast]);

  const getMaterialFile = useCallback(async (id: string): Promise<Blob | null> => {
    try {
      const file = await getFile(id);
      if (file) {
        await updateLastAccessed(id);
        return file.blob;
      }
      return null;
    } catch (error) {
      console.error('Error getting material file:', error);
      return null;
    }
  }, []);

  const checkForUpdates = useCallback(async (): Promise<void> => {
    if (!isOnline) return;

    try {
      const localVersions = await getLocalVersions();
      if (localVersions.size === 0) return;

      const materialIds = Array.from(localVersions.keys());

      const { data: serverMaterials, error } = await supabase
        .from('learning_materials')
        .select('id, version')
        .in('id', materialIds);

      if (error) throw error;

      const updates = new Map<string, number>();

      for (const serverMaterial of serverMaterials || []) {
        const localVersion = localVersions.get(serverMaterial.id);
        if (localVersion && serverMaterial.version > localVersion) {
          updates.set(serverMaterial.id, serverMaterial.version);
        }
      }

      setUpdatesAvailable(updates);

      if (updates.size > 0) {
        toast({
          title: 'Updates Available',
          description: `${updates.size} material(s) have updates available.`,
        });
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }, [isOnline, toast]);

  // Load pending sync count on mount
  useEffect(() => {
    refreshPendingSyncCount();
  }, [refreshPendingSyncCount]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isServiceWorkerReady,
        downloadedMaterials,
        downloadProgress,
        storageUsage,
        updatesAvailable,
        pendingSyncCount,
        downloadMaterial,
        removeMaterialOffline,
        getMaterialFile,
        checkForUpdates,
        refreshDownloadedMaterials,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

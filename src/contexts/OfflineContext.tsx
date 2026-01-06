/**
 * Offline Context - Manages offline state, download queue, and sync
 * Optimized for performance with memoization and batching
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  updatesAvailable: Map<string, number>;
  pendingSyncCount: number;
  downloadMaterial: (material: LearningMaterial) => Promise<boolean>;
  removeMaterialOffline: (id: string) => Promise<void>;
  getMaterialFile: (id: string) => Promise<Blob | null>;
  checkForUpdates: () => Promise<void>;
  refreshDownloadedMaterials: () => Promise<void>;
  downloadMultipleMaterials: (materials: LearningMaterial[]) => Promise<void>;
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
  
  // Refs for debouncing and preventing duplicate fetches
  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Debounced refresh for downloaded materials
  const refreshDownloadedMaterials = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    // Clear any pending debounce
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }
    
    isRefreshingRef.current = true;
    try {
      const [materials, usage] = await Promise.all([
        getAllMaterialsMetadata(),
        getStorageUsage()
      ]);
      setDownloadedMaterials(materials);
      setStorageUsage(usage);
    } catch (error) {
      console.error('Error loading downloaded materials:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Update pending sync count
  const refreshPendingSyncCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncItems();
      setPendingSyncCount(pending.length);
    } catch (error) {
      console.error('Error getting pending sync count:', error);
    }
  }, []);

  // Initialize service worker once
  useEffect(() => {
    registerServiceWorker().then((registration) => {
      if (registration) {
        setIsServiceWorkerReady(true);
      }
    });
  }, []);

  // Online/offline detection with debounced handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back Online',
        description: 'Your internet connection has been restored.',
      });
      // Delay update check to let connection stabilize
      setTimeout(() => checkForUpdates(), 1000);
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
    refreshPendingSyncCount();
  }, [refreshDownloadedMaterials, refreshPendingSyncCount]);

  const downloadMaterial = useCallback(async (material: LearningMaterial): Promise<boolean> => {
    const materialId = material.id;

    setDownloadProgress((prev) => {
      const next = new Map(prev);
      next.set(materialId, { materialId, progress: 10, status: 'downloading' });
      return next;
    });

    try {
      const { data: urlData } = supabase.storage
        .from('learning-materials')
        .getPublicUrl(material.file_url);

      const fileUrl = urlData.publicUrl;

      // Update progress to show we're fetching
      setDownloadProgress((prev) => {
        const next = new Map(prev);
        next.set(materialId, { materialId, progress: 30, status: 'downloading' });
        return next;
      });

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

        // Debounce refresh to batch multiple downloads
        if (refreshDebounceRef.current) {
          clearTimeout(refreshDebounceRef.current);
        }
        refreshDebounceRef.current = setTimeout(() => {
          refreshDownloadedMaterials();
        }, 500);

        toast({
          title: 'Download Complete',
          description: `"${material.title}" is now available offline.`,
        });

        // Clear progress after delay
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

  // Batch download multiple materials with concurrency control
  const downloadMultipleMaterials = useCallback(async (materials: LearningMaterial[]): Promise<void> => {
    const CONCURRENT_DOWNLOADS = 3;
    
    for (let i = 0; i < materials.length; i += CONCURRENT_DOWNLOADS) {
      const batch = materials.slice(i, i + CONCURRENT_DOWNLOADS);
      await Promise.all(batch.map(m => downloadMaterial(m)));
    }
    
    // Final refresh after all downloads
    await refreshDownloadedMaterials();
  }, [downloadMaterial, refreshDownloadedMaterials]);

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
        // Update last accessed in background
        updateLastAccessed(id).catch(console.error);
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
    downloadMultipleMaterials,
  }), [
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
    downloadMultipleMaterials,
  ]);

  return (
    <OfflineContext.Provider value={contextValue}>
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

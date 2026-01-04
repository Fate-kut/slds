/**
 * IndexedDB service for offline storage of learning materials
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MaterialMetadata {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subjectName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  downloadedAt: Date;
  lastAccessed: Date;
}

interface CachedFile {
  id: string;
  blob: Blob;
  mimeType: string;
}

interface SyncQueueItem {
  id: string;
  action: 'check_update' | 'download';
  materialId: string;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AuthCache {
  userId: string;
  userName: string;
  userRole: string;
  cachedAt: Date;
  expiresAt: Date;
}

interface SLDSOfflineDB extends DBSchema {
  materials: {
    key: string;
    value: MaterialMetadata;
    indexes: {
      'by-subject': string;
      'by-downloaded': Date;
    };
  };
  files: {
    key: string;
    value: CachedFile;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-status': string;
    };
  };
  authCache: {
    key: string;
    value: AuthCache;
  };
}

const DB_NAME = 'slds-offline-materials';
const DB_VERSION = 1;

let db: IDBPDatabase<SLDSOfflineDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<SLDSOfflineDB>> {
  if (db) return db;

  db = await openDB<SLDSOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Materials metadata store
      if (!database.objectStoreNames.contains('materials')) {
        const materialsStore = database.createObjectStore('materials', { keyPath: 'id' });
        materialsStore.createIndex('by-subject', 'subjectId');
        materialsStore.createIndex('by-downloaded', 'downloadedAt');
      }

      // File blobs store
      if (!database.objectStoreNames.contains('files')) {
        database.createObjectStore('files', { keyPath: 'id' });
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-status', 'status');
      }

      // Auth cache store
      if (!database.objectStoreNames.contains('authCache')) {
        database.createObjectStore('authCache', { keyPath: 'userId' });
      }
    },
  });

  return db;
}

// Material operations
export async function saveMaterialMetadata(material: MaterialMetadata): Promise<void> {
  const database = await getDB();
  await database.put('materials', material);
}

export async function getMaterialMetadata(id: string): Promise<MaterialMetadata | undefined> {
  const database = await getDB();
  return database.get('materials', id);
}

export async function getAllMaterialsMetadata(): Promise<MaterialMetadata[]> {
  const database = await getDB();
  return database.getAll('materials');
}

export async function deleteMaterialMetadata(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('materials', id);
}

// File operations
export async function saveFile(id: string, blob: Blob, mimeType: string): Promise<void> {
  const database = await getDB();
  await database.put('files', { id, blob, mimeType });
}

export async function getFile(id: string): Promise<CachedFile | undefined> {
  const database = await getDB();
  return database.get('files', id);
}

export async function deleteFile(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('files', id);
}

// Combined material and file operations
export async function downloadAndSaveMaterial(
  material: Omit<MaterialMetadata, 'downloadedAt' | 'lastAccessed'>,
  fileUrl: string
): Promise<boolean> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to fetch file');
    
    const blob = await response.blob();
    const mimeType = response.headers.get('content-type') || 'application/pdf';
    
    // Save to IndexedDB
    await saveFile(material.id, blob, mimeType);
    await saveMaterialMetadata({
      ...material,
      downloadedAt: new Date(),
      lastAccessed: new Date(),
    });
    
    return true;
  } catch (error) {
    console.error('Error downloading material:', error);
    return false;
  }
}

export async function removeMaterial(id: string): Promise<void> {
  await deleteFile(id);
  await deleteMaterialMetadata(id);
}

export async function updateLastAccessed(id: string): Promise<void> {
  const database = await getDB();
  const material = await database.get('materials', id);
  if (material) {
    material.lastAccessed = new Date();
    await database.put('materials', material);
  }
}

// Auth cache operations
export async function cacheAuth(auth: Omit<AuthCache, 'cachedAt' | 'expiresAt'>): Promise<void> {
  const database = await getDB();
  await database.put('authCache', {
    ...auth,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
}

export async function getCachedAuth(userId: string): Promise<AuthCache | undefined> {
  const database = await getDB();
  const auth = await database.get('authCache', userId);
  if (auth && new Date(auth.expiresAt) > new Date()) {
    return auth;
  }
  return undefined;
}

export async function clearAuthCache(): Promise<void> {
  const database = await getDB();
  await database.clear('authCache');
}

// Storage usage
export async function getStorageUsage(): Promise<{ used: number; materials: number }> {
  const database = await getDB();
  const files = await database.getAll('files');
  const materials = await database.getAll('materials');
  
  let totalSize = 0;
  for (const file of files) {
    totalSize += file.blob.size;
  }
  
  return {
    used: totalSize,
    materials: materials.length,
  };
}

// Check if material is downloaded
export async function isMaterialDownloaded(id: string): Promise<boolean> {
  const database = await getDB();
  const file = await database.get('files', id);
  return !!file;
}

// Get material versions for update checking
export async function getLocalVersions(): Promise<Map<string, number>> {
  const database = await getDB();
  const materials = await database.getAll('materials');
  const versions = new Map<string, number>();
  
  for (const material of materials) {
    versions.set(material.id, material.version);
  }
  
  return versions;
}

export type { MaterialMetadata, CachedFile, AuthCache };

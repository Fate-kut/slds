/**
 * Sync Queue Hook - Queues actions when offline and syncs when back online
 */

import { useCallback, useEffect, useRef } from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import {
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItem,
  removeSyncItem,
  clearCompletedSyncItems,
  SyncQueueItem,
} from '@/lib/offline/indexedDB';
import { useToast } from '@/hooks/use-toast';

interface QueuedAction {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  maxRetries?: number;
}

export function useSyncQueue() {
  const { isOnline } = useOffline();
  const { toast } = useToast();
  const isSyncing = useRef(false);

  // Queue an action for later execution
  const queueAction = useCallback(async (action: QueuedAction): Promise<string> => {
    const id = await addToSyncQueue({
      action: action.endpoint,
      endpoint: action.endpoint,
      method: action.method,
      body: action.body,
      headers: action.headers,
      maxRetries: action.maxRetries ?? 3,
    });

    toast({
      title: 'Action Queued',
      description: 'This action will be synced when you\'re back online.',
    });

    return id;
  }, [toast]);

  // Execute a single queued action
  const executeAction = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    try {
      await updateSyncItem(item.id, { status: 'in_progress' });

      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers,
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (response.ok) {
        await updateSyncItem(item.id, { status: 'completed' });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Sync action failed:', error);

      if (item.retryCount >= item.maxRetries) {
        await updateSyncItem(item.id, { status: 'failed' });
        return false;
      }

      await updateSyncItem(item.id, {
        status: 'pending',
        retryCount: item.retryCount + 1,
      });
      return false;
    }
  }, []);

  // Process all pending sync items
  const processSyncQueue = useCallback(async (): Promise<{ succeeded: number; failed: number }> => {
    if (isSyncing.current) {
      return { succeeded: 0, failed: 0 };
    }

    isSyncing.current = true;
    let succeeded = 0;
    let failed = 0;

    try {
      const pendingItems = await getPendingSyncItems();

      for (const item of pendingItems) {
        const success = await executeAction(item);
        if (success) {
          succeeded++;
        } else if (item.retryCount >= item.maxRetries) {
          failed++;
        }
      }

      // Clean up completed items
      await clearCompletedSyncItems();

      if (succeeded > 0 || failed > 0) {
        toast({
          title: 'Sync Complete',
          description: `${succeeded} action(s) synced${failed > 0 ? `, ${failed} failed` : ''}.`,
          variant: failed > 0 ? 'destructive' : 'default',
        });
      }
    } finally {
      isSyncing.current = false;
    }

    return { succeeded, failed };
  }, [executeAction, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        processSyncQueue();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, processSyncQueue]);

  // Remove a queued action
  const removeQueuedAction = useCallback(async (id: string): Promise<void> => {
    await removeSyncItem(id);
  }, []);

  // Get pending actions count
  const getPendingCount = useCallback(async (): Promise<number> => {
    const items = await getPendingSyncItems();
    return items.length;
  }, []);

  return {
    queueAction,
    processSyncQueue,
    removeQueuedAction,
    getPendingCount,
    isOnline,
  };
}

export default useSyncQueue;

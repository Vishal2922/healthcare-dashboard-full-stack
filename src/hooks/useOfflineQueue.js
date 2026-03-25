/**
 * useOfflineQueue.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified React hook for the global offline queue.
 *
 * Provides:
 *   • isOnline       — current network status
 *   • pendingCount   — total pending items across all modules
 *   • failedCount    — items that failed all retries
 *   • isFlushing     — true while queue is draining
 *   • lastSync       — timestamp of last successful sync
 *   • queueByModule  — { patients: [...], prescriptions: [...], ... }
 *   • manualSync()   — trigger immediate flush (when online)
 *   • dismissFailed()— clear permanently failed items
 *
 * Usage:
 *   const { isOnline, pendingCount, manualSync } = useOfflineQueue();
 */

import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';

import {
  selectIsOnline,
  selectIsFlushing,
  selectPendingCount,
  selectOfflineQueue,
  selectFailedItems,
  selectLastSync,
  selectSyncError,
  dropExhaustedItems,
} from '../modules/offline/offlineSlice';

export default function useOfflineQueue() {
  const dispatch = useDispatch();

  const isOnline     = useSelector(selectIsOnline);
  const isFlushing   = useSelector(selectIsFlushing);
  const pendingCount = useSelector(selectPendingCount);
  const allQueue     = useSelector(selectOfflineQueue);
  const failedItems  = useSelector(selectFailedItems);
  const lastSync     = useSelector(selectLastSync);
  const syncError    = useSelector(selectSyncError);

  // Group queue by module
  const queueByModule = allQueue.reduce((acc, item) => {
    if (!acc[item.module]) acc[item.module] = [];
    acc[item.module].push(item);
    return acc;
  }, {});

  const failedCount = failedItems.length;

  // Trigger a manual sync
  const manualSync = useCallback(() => {
    dispatch({ type: 'offline/manualFlush' });
  }, [dispatch]);

  // Dismiss all permanently failed items
  const dismissFailed = useCallback(() => {
    dispatch(dropExhaustedItems());
  }, [dispatch]);

  return {
    isOnline,
    isFlushing,
    pendingCount,
    failedCount,
    allQueue,
    queueByModule,
    failedItems,
    lastSync,
    syncError,
    manualSync,
    dismissFailed,
    // Convenience
    hasItems:    allQueue.length > 0,
    hasPending:  pendingCount > 0,
    hasFailed:   failedCount > 0,
  };
}
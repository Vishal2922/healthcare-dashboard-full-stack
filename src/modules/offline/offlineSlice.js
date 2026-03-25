/**
 * offlineSlice.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Redux slice for the global offline queue.
 *
 * Manages a unified queue across all modules (patients, prescriptions,
 * billing, staff) so one saga can process everything and one UI banner
 * can show the combined pending count.
 *
 * Per-module slices (patientSlice, billingSlice, etc.) keep their own
 * isOnline / isFlushing flags for UI granularity, but this slice is the
 * canonical queue store.
 *
 * State shape:
 * {
 *   queue:      QueueItem[]   — all pending actions
 *   isOnline:   boolean       — mirrors navigator.onLine
 *   isFlushing: boolean       — true while flush is running
 *   lastSync:   number|null   — timestamp of last successful flush
 *   syncError:  string|null   — last flush error
 * }
 *
 * QueueItem shape:
 * {
 *   id:           string   (uuid)
 *   module:       'patients'|'prescriptions'|'billing'|'staff'
 *   type:         'create'|'update'|'delete'|'updateStatus'
 *   payload:      object
 *   timestamp:    number
 *   retries:      number   (0..MAX_RETRIES)
 *   status:       'pending'|'processing'|'success'|'failed'
 *   errorMessage: string|null
 * }
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  queue:      [],
  isOnline:   typeof navigator !== 'undefined' ? navigator.onLine : true,
  isFlushing: false,
  lastSync:   null,
  syncError:  null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,

  reducers: {

    // ── Network Status ─────────────────────────────────────────────────────
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },

    // ── Enqueue ────────────────────────────────────────────────────────────
    /**
     * Add a new item to the queue.
     * payload: { id, module, type, payload, timestamp, retries, status }
     */
    enqueueAction: (state, action) => {
      // Prevent exact duplicates (same module + type + payload hash)
      const incoming = action.payload;
      const isDuplicate = state.queue.some(
        (item) =>
          item.status === 'pending' &&
          item.module === incoming.module &&
          item.type   === incoming.type &&
          JSON.stringify(item.payload) === JSON.stringify(incoming.payload)
      );
      if (!isDuplicate) {
        state.queue.push({
          ...incoming,
          retries:      incoming.retries      ?? 0,
          status:       incoming.status       ?? 'pending',
          errorMessage: incoming.errorMessage ?? null,
        });
      }
    },

    // ── Dequeue (remove by id) ──────────────────────────────────────────────
    dequeueAction: (state, action) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
    },

    // ── Update item (retries, status, errorMessage) ────────────────────────
    updateQueueItem: (state, action) => {
      const { id, ...patch } = action.payload;
      const item = state.queue.find((q) => q.id === id);
      if (item) Object.assign(item, patch);
    },

    // ── Mark item as processing ────────────────────────────────────────────
    markProcessing: (state, action) => {
      const item = state.queue.find((q) => q.id === action.payload);
      if (item) item.status = 'processing';
    },

    // ── Mark item as success (then dequeue) ────────────────────────────────
    markSuccess: (state, action) => {
      state.queue = state.queue.filter((q) => q.id !== action.payload);
    },

    // ── Mark item as failed ────────────────────────────────────────────────
    markFailed: (state, action) => {
      const { id, errorMessage } = action.payload;
      const item = state.queue.find((q) => q.id === id);
      if (item) {
        item.status       = 'failed';
        item.errorMessage = errorMessage ?? 'Unknown error';
      }
    },

    // ── Increment retry counter ────────────────────────────────────────────
    incrementRetry: (state, action) => {
      const item = state.queue.find((q) => q.id === action.payload);
      if (item) {
        item.retries = (item.retries ?? 0) + 1;
        item.status  = 'pending'; // reset to pending for next attempt
      }
    },

    // ── Drop permanently failed items (retries exhausted) ─────────────────
    dropExhaustedItems: (state) => {
      state.queue = state.queue.filter((q) => q.status !== 'failed' || q.retries < 3);
    },

    // ── Flush lifecycle ───────────────────────────────────────────────────
    flushStart: (state) => {
      state.isFlushing = true;
      state.syncError  = null;
    },
    flushComplete: (state) => {
      state.isFlushing = false;
      state.lastSync   = Date.now();
    },
    flushError: (state, action) => {
      state.isFlushing = false;
      state.syncError  = action.payload;
    },

    // ── Bulk load (restore from IndexedDB on startup) ──────────────────────
    hydrateQueue: (state, action) => {
      // Only load items that are still pending (not success/dropped)
      state.queue = (action.payload || []).filter(
        (item) => item.status === 'pending' || item.status === 'failed'
      );
    },

    // ── Clear ─────────────────────────────────────────────────────────────
    clearQueue: (state) => {
      state.queue = [];
    },
    clearModuleQueue: (state, action) => {
      state.queue = state.queue.filter((item) => item.module !== action.payload);
    },
  },
});

export const {
  setOnlineStatus,
  enqueueAction,
  dequeueAction,
  updateQueueItem,
  markProcessing,
  markSuccess,
  markFailed,
  incrementRetry,
  dropExhaustedItems,
  flushStart,
  flushComplete,
  flushError,
  hydrateQueue,
  clearQueue,
  clearModuleQueue,
} = offlineSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectOfflineQueue      = (state) => state.offline.queue;
export const selectIsOnline          = (state) => state.offline.isOnline;
export const selectIsFlushing        = (state) => state.offline.isFlushing;
export const selectLastSync          = (state) => state.offline.lastSync;
export const selectSyncError         = (state) => state.offline.syncError;
export const selectPendingCount      = (state) =>
  state.offline.queue.filter((q) => q.status === 'pending').length;
export const selectPendingByModule   = (module) => (state) =>
  state.offline.queue.filter((q) => q.module === module && q.status === 'pending');
export const selectFailedItems       = (state) =>
  state.offline.queue.filter((q) => q.status === 'failed');

export default offlineSlice.reducer;
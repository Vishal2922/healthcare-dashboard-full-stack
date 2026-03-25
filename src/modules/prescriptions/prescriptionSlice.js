/**
 * prescriptionSlice.js  (UPDATED — Offline Queue + Prefetch Pagination)
 * ─────────────────────────────────────────────────────────────────────────────
 * Adds:
 *   • meta / filters for pagination support
 *   • pageCache for prefetch pagination
 *   • offline queue indicators (isOnline, isFlushing)
 *   • prefetching flag for background next-page loading
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list:        [],
  selectedRx:  null,

  // ── Pagination ─────────────────────────────────────────────────────────────
  meta: {
    total:    0,
    page:     1,
    per_page: 10,
    last_page: 1,
  },

  filters: {
    patient_id: null,
    status:     null,
  },

  // ── Page cache (cacheKey → { data, meta }) ─────────────────────────────────
  pageCache:   {},
  prefetching: false,

  listLoading:    false,
  formLoading:    false,
  error:          null,
  successMessage: null,

  // ── Offline ────────────────────────────────────────────────────────────────
  isOnline:     true,
  isFlushing:   false,
  offlineQueue: [], // kept for backwards compatibility
};

const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,

  reducers: {

    // ── Fetch List ────────────────────────────────────────────────────────────
    fetchPrescriptionsRequest: (state, action) => {
      state.listLoading = true;
      state.error       = null;
      if (action.payload?.filters) {
        state.filters = { ...state.filters, ...action.payload.filters };
      }
    },
    fetchPrescriptionsSuccess: (state, action) => {
      // Supports both legacy (array) and new (paginated { data, meta, cacheKey })
      if (Array.isArray(action.payload)) {
        state.list        = action.payload;
        state.listLoading = false;
      } else {
        const { data, meta, cacheKey } = action.payload;
        state.list        = data;
        state.meta        = meta;
        state.listLoading = false;
        if (cacheKey) state.pageCache[cacheKey] = { data, meta };
      }
    },
    fetchPrescriptionsFailure: (state, action) => {
      state.listLoading = false;
      state.error       = action.payload;
    },

    // ── Cache operations ──────────────────────────────────────────────────────
    serveFromCache: (state, action) => {
      const { data, meta } = action.payload;
      state.list        = data;
      state.meta        = meta;
      state.listLoading = false;
    },
    prefetchPageRequest:  (state) => { state.prefetching = true; },
    prefetchPageSuccess:  (state, action) => {
      state.prefetching = false;
      const { cacheKey, data, meta } = action.payload;
      if (cacheKey) state.pageCache[cacheKey] = { data, meta };
    },
    prefetchPageFailure:  (state) => { state.prefetching = false; },
    invalidatePageCache:  (state) => { state.pageCache = {}; },

    // ── Create ────────────────────────────────────────────────────────────────
    createPrescriptionRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    createPrescriptionSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = action.payload?.message || 'Prescription created successfully.';
      const rx = action.payload?.prescription ?? action.payload?.data?.prescription;
      if (rx) {
        state.list = [rx, ...state.list];
        state.meta.total += 1;
      }
      state.pageCache = {}; // invalidate after mutation
    },
    createPrescriptionFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Update ────────────────────────────────────────────────────────────────
    updatePrescriptionRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    updatePrescriptionSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = action.payload?.message || 'Prescription updated.';
      const { id, status } = action.payload ?? {};
      if (id) {
        state.list = state.list.map((rx) =>
          rx.id === id ? { ...rx, status, ...action.payload } : rx
        );
      }
      state.pageCache = {}; // invalidate after mutation
    },
    updatePrescriptionFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Offline indicators ────────────────────────────────────────────────────
    setOnlineStatus:   (state, action) => { state.isOnline   = action.payload; },
    setFlushingStatus: (state, action) => { state.isFlushing = action.payload; },

    // ── Legacy offline queue ──────────────────────────────────────────────────
    enqueueOfflineAction: (state, action) => { state.offlineQueue.push(action.payload); },
    dequeueOfflineAction: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter((i) => i.id !== action.payload);
    },

    // ── UI helpers ────────────────────────────────────────────────────────────
    setSelectedRx:   (state, action) => { state.selectedRx     = action.payload; },
    clearSelectedRx: (state)         => { state.selectedRx     = null; },
    setFilters:      (state, action) => {
      state.filters   = { ...state.filters, ...action.payload };
      state.pageCache = {};
    },
    resetFilters:    (state)         => {
      state.filters   = initialState.filters;
      state.pageCache = {};
    },
    clearError:      (state)         => { state.error          = null; },
    clearSuccess:    (state)         => { state.successMessage  = null; },
  },
});

export const {
  fetchPrescriptionsRequest,
  fetchPrescriptionsSuccess,
  fetchPrescriptionsFailure,
  serveFromCache,
  prefetchPageRequest,
  prefetchPageSuccess,
  prefetchPageFailure,
  invalidatePageCache,
  createPrescriptionRequest,
  createPrescriptionSuccess,
  createPrescriptionFailure,
  updatePrescriptionRequest,
  updatePrescriptionSuccess,
  updatePrescriptionFailure,
  setOnlineStatus,
  setFlushingStatus,
  enqueueOfflineAction,
  dequeueOfflineAction,
  setSelectedRx,
  clearSelectedRx,
  setFilters,
  resetFilters,
  clearError,
  clearSuccess,
} = prescriptionSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectPrescriptionList        = (s) => s.prescriptions.list;
export const selectSelectedRx              = (s) => s.prescriptions.selectedRx;
export const selectPrescriptionMeta        = (s) => s.prescriptions.meta;
export const selectPrescriptionFilters     = (s) => s.prescriptions.filters;
export const selectPrescriptionPageCache   = (s) => s.prescriptions.pageCache;
export const selectPrescriptionPrefetching = (s) => s.prescriptions.prefetching;
export const selectPrescriptionListLoading = (s) => s.prescriptions.listLoading;
export const selectPrescriptionFormLoading = (s) => s.prescriptions.formLoading;
export const selectPrescriptionError       = (s) => s.prescriptions.error;
export const selectPrescriptionSuccess     = (s) => s.prescriptions.successMessage;
export const selectPrescriptionIsOnline    = (s) => s.prescriptions.isOnline;
export const selectPrescriptionIsFlushing  = (s) => s.prescriptions.isFlushing;

export default prescriptionSlice.reducer;
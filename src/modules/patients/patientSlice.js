/**
 * patientSlice.js  (UPDATED — Offline Queue + Prefetch Pagination)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *   • pageCache: object keyed by cacheKey → { data, meta }
 *     Holds all previously-fetched pages in Redux for instant navigation.
 *   • prefetchingPages: Set<string> — tracks in-flight prefetch requests
 *   • nextPagePrefetched: boolean — true when next page is already prefetched
 *   • Offline queue now delegates to global offlineSlice; kept for backwards
 *     compatibility of local isOnline / isFlushing indicators.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  allPatients: [],
  selectedPatient: null,

  meta: {
    total:    0,
    page:     1,
    per_page: 5,
    last_page: 1,
  },

  filters: {
    search: '',
    gender: null,
    status: 'active',
  },

  // ── Page cache (cacheKey → { data, meta }) ─────────────────────────────────
  pageCache:   {},
  prefetching: false,    // true while a background prefetch is running

  listLoading:    false,
  detailLoading:  false,
  formLoading:    false,
  allPatientsLoading: false,
  prefetchLoading: false,
  prefetched:     false,

  error:          null,
  successMessage: null,

  // ── Offline indicators (mirrors global offlineSlice) ──────────────────────
  isOnline:   true,
  isFlushing: false,

  // Legacy queue kept for compatibility with existing usePatients hook
  offlineQueue: [],
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,

  reducers: {

    // ── Fetch List ────────────────────────────────────────────────────────────
    fetchPatientsRequest: (state, action) => {
      // `_prefetch` is background pagination: never show the main list loader.
      if (action.payload?._prefetch) {
        state.prefetching = true;
        return;
      }

      state.listLoading = true;
      state.error       = null;
      if (action.payload?.filters) {
        state.filters = { ...state.filters, ...action.payload.filters };
      }
    },
    fetchPatientsSuccess: (state, action) => {
      const { data, meta, cacheKey } = action.payload;
      state.list        = data;
      state.meta        = meta;
      state.listLoading = false;

      // Store in page cache
      if (cacheKey) {
        state.pageCache[cacheKey] = { data, meta };
      }
    },
    fetchPatientsFailure: (state, action) => {
      state.listLoading = false;
      state.error       = action.payload;
    },

    // ── Fetch All (for dropdowns) ───────────────────────────────────────────
    fetchAllPatientsRequest: (state) => {
      state.allPatientsLoading = true;
      state.error = null;
    },
    fetchAllPatientsSuccess: (state, action) => {
      state.allPatients = action.payload;
      state.allPatientsLoading = false;
    },
    fetchAllPatientsFailure: (state, action) => {
      state.allPatientsLoading = false;
      state.error = action.payload;
    },

    // ── Serve from Cache (instant navigation) ─────────────────────────────────
    serveFromCache: (state, action) => {
      const { data, meta } = action.payload;
      state.list      = data;
      state.meta      = meta;
      state.listLoading = false; // no loading spinner for cache hits
    },

    // ── Prefetch Next Page ────────────────────────────────────────────────────
    prefetchPageRequest: (state) => {
      state.prefetching = true;
    },
    prefetchPageSuccess: (state, action) => {
      const { cacheKey, data, meta } = action.payload;
      state.prefetching = false;
      if (cacheKey) {
        state.pageCache[cacheKey] = { data, meta };
      }
    },
    prefetchPageFailure: (state) => {
      state.prefetching = false; // silent fail — prefetch is best-effort
    },

    // ── Invalidate cache (after mutations) ────────────────────────────────────
    invalidatePageCache: (state) => {
      state.pageCache = {};
    },

    // ── Fetch Single ──────────────────────────────────────────────────────────
    fetchPatientByIdRequest: (state) => {
      state.detailLoading = true;
      state.error         = null;
    },
    fetchPatientByIdSuccess: (state, action) => {
      state.selectedPatient = action.payload;
      state.detailLoading   = false;
    },
    fetchPatientByIdFailure: (state, action) => {
      state.detailLoading = false;
      state.error         = action.payload;
    },

    // ── Create ────────────────────────────────────────────────────────────────
    createPatientRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    createPatientSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Patient registered successfully.';
      state.list.unshift(action.payload);
      state.meta.total += 1;
      state.pageCache   = {}; // invalidate cache after mutation
    },
    createPatientFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Update ────────────────────────────────────────────────────────────────
    updatePatientRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    updatePatientSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Patient record updated.';
      const idx = state.list.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.selectedPatient?.id === action.payload.id) {
        state.selectedPatient = action.payload;
      }
      state.pageCache = {}; // invalidate cache after mutation
    },
    updatePatientFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Delete ────────────────────────────────────────────────────────────────
    deletePatientRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    deletePatientSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Patient record deleted.';
      state.list           = state.list.filter((p) => p.id !== action.payload);
      state.meta.total     = Math.max(0, state.meta.total - 1);
      state.pageCache      = {}; // invalidate cache after mutation
    },
    deletePatientFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Prefetch meta (filter ref data) ──────────────────────────────────────
    prefetchPatientsMetaRequest: (state) => { state.prefetchLoading = true; },
    prefetchPatientsMetaSuccess: (state) => {
      state.prefetchLoading = false;
      state.prefetched      = true;
    },
    prefetchPatientsMetaFailure: (state, action) => {
      state.prefetchLoading = false;
      state.error           = action.payload;
    },

    // ── Offline status mirrors (synced from global offlineSlice) ─────────────
    setOnlineStatus:       (state, action) => { state.isOnline   = action.payload; },
    setFlushingStatus:     (state, action) => { state.isFlushing = action.payload; },

    // ── Legacy offline queue (kept for hook compatibility) ────────────────────
    enqueueOfflineAction:  (state, action) => { state.offlineQueue.push(action.payload); },
    dequeueOfflineAction:  (state, action) => {
      state.offlineQueue = state.offlineQueue.filter((i) => i.id !== action.payload);
    },
    flushOfflineQueueStart:(state) => { state.isFlushing = true;  },
    flushOfflineQueueEnd:  (state) => { state.isFlushing = false; },
    incrementQueueRetry:   (state, action) => {
      const item = state.offlineQueue.find((q) => q.id === action.payload);
      if (item) item.retries = (item.retries || 0) + 1;
    },

    // ── UI Helpers ────────────────────────────────────────────────────────────
    setSelectedPatient:   (state, action) => { state.selectedPatient = action.payload; },
    clearSelectedPatient: (state)         => { state.selectedPatient = null; },
    setFilters:  (state, action) => {
      state.filters   = { ...state.filters, ...action.payload };
      state.pageCache = {}; // filter change → invalidate all cached pages
    },
    resetFilters:(state) => {
      state.filters   = initialState.filters;
      state.pageCache = {};
    },
    clearSuccess:(state) => { state.successMessage = null; },
    clearError:  (state) => { state.error = null; },
  },
});

export const {
  fetchPatientsRequest,
  fetchPatientsSuccess,
  fetchPatientsFailure,
  fetchAllPatientsRequest,
  fetchAllPatientsSuccess,
  fetchAllPatientsFailure,
  serveFromCache,
  prefetchPageRequest,
  prefetchPageSuccess,
  prefetchPageFailure,
  invalidatePageCache,
  fetchPatientByIdRequest,
  fetchPatientByIdSuccess,
  fetchPatientByIdFailure,
  createPatientRequest,
  createPatientSuccess,
  createPatientFailure,
  updatePatientRequest,
  updatePatientSuccess,
  updatePatientFailure,
  deletePatientRequest,
  deletePatientSuccess,
  deletePatientFailure,
  prefetchPatientsMetaRequest,
  prefetchPatientsMetaSuccess,
  prefetchPatientsMetaFailure,
  setOnlineStatus,
  setFlushingStatus,
  enqueueOfflineAction,
  dequeueOfflineAction,
  flushOfflineQueueStart,
  flushOfflineQueueEnd,
  incrementQueueRetry,
  setSelectedPatient,
  clearSelectedPatient,
  setFilters,
  resetFilters,
  clearSuccess,
  clearError,
} = patientSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectPatientList        = (s) => s.patients.list;
export const selectSelectedPatient    = (s) => s.patients.selectedPatient;
export const selectPatientMeta        = (s) => s.patients.meta;
export const selectPatientFilters     = (s) => s.patients.filters;
export const selectPatientListLoading = (s) => s.patients.listLoading;
export const selectPatientDetailLoading=(s) => s.patients.detailLoading;
export const selectPatientFormLoading = (s) => s.patients.formLoading;
export const selectPatientPrefetched  = (s) => s.patients.prefetched;
export const selectPatientPrefetching = (s) => s.patients.prefetching;
export const selectPatientPageCache   = (s) => s.patients.pageCache;
export const selectPatientError       = (s) => s.patients.error;
export const selectPatientSuccess     = (s) => s.patients.successMessage;
export const selectAllPatients        = (s) => s.patients.allPatients;
export const selectAllPatientsLoading = (s) => s.patients.allPatientsLoading;
export const selectPatientOfflineQueue= (s) => s.patients.offlineQueue;
export const selectPatientIsOnline    = (s) => s.patients.isOnline;
export const selectPatientIsFlushing  = (s) => s.patients.isFlushing;

export default patientSlice.reducer;
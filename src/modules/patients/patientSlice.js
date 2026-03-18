import { createSlice } from '@reduxjs/toolkit';

/**
 * patientSlice — Module 8: Patient Management
 *
 * State shape:
 *   list            → paginated patient array (current page)
 *   selectedPatient → patient being viewed / edited
 *   meta            → { total, page, per_page, last_page }
 *   filters         → { search, gender, status }
 *   listLoading     → skeleton for table
 *   detailLoading   → skeleton for profile page
 *   formLoading     → submit spinner on create/edit form
 *   prefetchLoading → loading filter-option reference data
 *   prefetched      → boolean flag — prefetch done once per session
 *   error           → last error string (cleared on next request)
 *   successMessage  → shown in toast/alert after CUD action
 *   offlineQueue    → pending mutations queued while offline
 *                     [ { id, type:'create'|'update'|'delete', payload, timestamp, retries } ]
 *   isOnline        → navigator.onLine mirror
 *   isFlushing      → true while queue is draining
 */

const initialState = {
  list: [],
  selectedPatient: null,

  meta: {
    total: 0,
    page: 1,
    per_page: 10,
    last_page: 1,
  },

  filters: {
    search: '',
    gender: null,
    status: 'active',
  },

  listLoading:    false,
  detailLoading:  false,
  formLoading:    false,
  prefetchLoading: false,
  prefetched:     false,

  error:          null,
  successMessage: null,

  // ── Offline Queue ────────────────────────────────────────────────────────
  offlineQueue: [],
  isOnline:     true,
  isFlushing:   false,
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,

  reducers: {
    // ── Fetch List ────────────────────────────────────────────────────────
    fetchPatientsRequest: (state, action) => {
      state.listLoading = true;
      state.error       = null;
      if (action.payload?.filters) {
        state.filters = { ...state.filters, ...action.payload.filters };
      }
    },
    fetchPatientsSuccess: (state, action) => {
      state.list        = action.payload.data;
      state.meta        = action.payload.meta;
      state.listLoading = false;
    },
    fetchPatientsFailure: (state, action) => {
      state.listLoading = false;
      state.error       = action.payload;
    },

    // ── Fetch Single ──────────────────────────────────────────────────────
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

    // ── Create ────────────────────────────────────────────────────────────
    createPatientRequest: (state) => {
      state.formLoading   = true;
      state.error         = null;
      state.successMessage = null;
    },
    createPatientSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Patient registered successfully.';
      state.list.unshift(action.payload);
      state.meta.total    += 1;
    },
    createPatientFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Update ────────────────────────────────────────────────────────────
    updatePatientRequest: (state) => {
      state.formLoading   = true;
      state.error         = null;
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
    },
    updatePatientFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Delete ────────────────────────────────────────────────────────────
    deletePatientRequest: (state) => {
      state.formLoading   = true;
      state.error         = null;
      state.successMessage = null;
    },
    deletePatientSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Patient record deleted.';
      state.list           = state.list.filter((p) => p.id !== action.payload);
      state.meta.total     = Math.max(0, state.meta.total - 1);
    },
    deletePatientFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Prefetch (filter reference data) ─────────────────────────────────
    // Patient module doesn't need heavy prefetch like staff,
    // but we still set the flag so the hook only runs once.
    prefetchPatientsMetaRequest: (state) => {
      state.prefetchLoading = true;
    },
    prefetchPatientsMetaSuccess: (state) => {
      state.prefetchLoading = false;
      state.prefetched      = true;
    },
    prefetchPatientsMetaFailure: (state, action) => {
      state.prefetchLoading = false;
      state.error           = action.payload;
    },

    // ── Offline Queue ─────────────────────────────────────────────────────
    enqueueOfflineAction: (state, action) => {
      state.offlineQueue.push(action.payload);
    },
    dequeueOfflineAction: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter(
        (item) => item.id !== action.payload
      );
    },
    flushOfflineQueueStart: (state) => { state.isFlushing = true;  },
    flushOfflineQueueEnd:   (state) => { state.isFlushing = false; },
    setOnlineStatus:        (state, action) => { state.isOnline = action.payload; },
    incrementQueueRetry: (state, action) => {
      const item = state.offlineQueue.find((q) => q.id === action.payload);
      if (item) item.retries = (item.retries || 0) + 1;
    },

    // ── UI Helpers ────────────────────────────────────────────────────────
    setSelectedPatient:  (state, action) => { state.selectedPatient = action.payload; },
    clearSelectedPatient:(state)         => { state.selectedPatient = null; },
    setFilters:  (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    resetFilters:(state)         => { state.filters = initialState.filters; },
    clearSuccess:(state)         => { state.successMessage = null; },
    clearError:  (state)         => { state.error = null; },
  },
});

export const {
  fetchPatientsRequest,
  fetchPatientsSuccess,
  fetchPatientsFailure,
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
  enqueueOfflineAction,
  dequeueOfflineAction,
  flushOfflineQueueStart,
  flushOfflineQueueEnd,
  setOnlineStatus,
  incrementQueueRetry,
  setSelectedPatient,
  clearSelectedPatient,
  setFilters,
  resetFilters,
  clearSuccess,
  clearError,
} = patientSlice.actions;

export default patientSlice.reducer;

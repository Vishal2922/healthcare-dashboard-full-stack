/**
 * appointmentSlice.js  (UPDATED — Prefetch Pagination with pageCache)
 * ─────────────────────────────────────────────────────────────────────────────
 * Now uses the same pageCache pattern as patientSlice / prescriptionSlice
 * for instant page navigation and background prefetch of next pages.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],

  // ── Pagination meta (mirrors backend response) ──────────────────────────
  meta: {
    total:       0,
    page:        1,
    per_page:    5,
    total_pages: 0,
  },

  selectedAppointment: null,

  loading: false,
  rowLoading: {},
  error: null,

  filters: {
    status: '',
  },

  // ── Page cache (cacheKey → { data, meta }) ──────────────────────────────
  pageCache:   {},
  prefetching: false,    // true while a background prefetch is running

  offlineQueue: [],
  isOnline: true,
  isDrainingQueue: false,

  conflictCheck: {
    checking: false,
    isAvailable: null,
    checkedSlot: null,
  },

  bookingLoading: false,
  bookingError: null,
  bookingSuccess: false,
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {

    // ── Fetch List ──────────────────────────────────────────
    fetchAppointmentsRequest: (state, action) => {
      // `_prefetch` is background pagination: never show the main list loader.
      if (action.payload?._prefetch) {
        state.prefetching = true;
        return;
      }

      state.loading = true;
      state.error = null;
      if (action.payload) {
        const { _prefetch, ...rest } = action.payload;
        if (rest.status !== undefined) state.filters.status = rest.status;
      }
    },
    fetchAppointmentsSuccess: (state, action) => {
      const { appointments, pagination, cacheKey } = action.payload;
      state.list = appointments;
      state.meta = pagination;
      state.loading = false;
      state.prefetching = false;
      state.error = null;

      // Store in page cache
      if (cacheKey) {
        state.pageCache[cacheKey] = { data: appointments, meta: pagination };
      }
    },
    fetchAppointmentsFailure: (state, action) => {
      state.loading = false;
      state.prefetching = false;
      state.error = action.payload;
    },

    // ── Serve from Cache (instant navigation) ────────────────
    serveFromCache: (state, action) => {
      const { data, meta } = action.payload;
      state.list    = data;
      state.meta    = meta;
      state.loading = false;
    },

    // ── Prefetch Next Page ───────────────────────────────────
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
      state.prefetching = false;
    },

    // ── Invalidate cache (after mutations) ───────────────────
    invalidatePageCache: (state) => {
      state.pageCache = {};
    },

    // ── Book Appointment ────────────────────────────────────
    bookAppointmentRequest: (state) => {
      state.bookingLoading = true;
      state.bookingError = null;
      state.bookingSuccess = false;
    },
    bookAppointmentSuccess: (state, action) => {
      state.bookingLoading = false;
      state.bookingSuccess = true;
      state.bookingError = null;
      state.list = [action.payload, ...state.list];
      state.pageCache = {};
      state.conflictCheck = { checking: false, isAvailable: null, checkedSlot: null };
    },
    bookAppointmentFailure: (state, action) => {
      state.bookingLoading = false;
      state.bookingError = action.payload;
      state.bookingSuccess = false;
    },
    resetBookingState: (state) => {
      state.bookingLoading = false;
      state.bookingError = null;
      state.bookingSuccess = false;
    },

    // ── Update Status ───────────────────────────────────────
    updateStatusRequest: (state, action) => {
      state.rowLoading[action.payload.id] = true;
      state.error = null;
    },
    updateStatusSuccess: (state, action) => {
      const updated = action.payload;
      state.rowLoading[updated.id] = false;
      state.list = state.list.map((a) => a.id === updated.id ? updated : a);
      if (state.selectedAppointment?.id === updated.id) state.selectedAppointment = updated;
      state.pageCache = {};
    },
    updateStatusFailure: (state, action) => {
      const { id, message } = action.payload;
      state.rowLoading[id] = false;
      state.error = message;
    },

    // ── Cancel Appointment ──────────────────────────────────
    cancelAppointmentRequest: (state, action) => {
      state.rowLoading[action.payload.id] = true;
      state.error = null;
    },
    cancelAppointmentSuccess: (state, action) => {
      const { id } = action.payload;
      state.rowLoading[id] = false;
      state.list = state.list.map((a) => a.id === id ? { ...a, status: 'cancelled' } : a);
      state.pageCache = {};
    },
    cancelAppointmentFailure: (state, action) => {
      const { id, message } = action.payload;
      state.rowLoading[id] = false;
      state.error = message;
    },

    // ── Conflict Check ──────────────────────────────────────
    checkSlotConflictRequest: (state, action) => {
      state.conflictCheck = {
        checking: true,
        isAvailable: null,
        checkedSlot: action.payload?.appointment_time ?? null,
      };
    },
    checkSlotConflictSuccess: (state, action) => {
      state.conflictCheck = {
        checking: false,
        isAvailable: action.payload.isAvailable,
        checkedSlot: action.payload.checkedSlot,
      };
    },
    checkSlotConflictFailure: (state) => {
      state.conflictCheck = { checking: false, isAvailable: null, checkedSlot: null };
    },
    resetConflictCheck: (state) => {
      state.conflictCheck = { checking: false, isAvailable: null, checkedSlot: null };
    },

    // ── Offline Queue ───────────────────────────────────────
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    enqueueOfflineAction: (state, action) => {
      state.offlineQueue.push(action.payload);
    },
    setDrainingQueue: (state, action) => {
      state.isDrainingQueue = action.payload;
    },
    dequeueOfflineAction: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter((item) => item.id !== action.payload);
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
      state.isDrainingQueue = false;
    },

    // ── Misc ────────────────────────────────────────────────
    setSelectedAppointment: (state, action) => {
      state.selectedAppointment = action.payload;
    },
    clearAppointmentError: (state) => {
      state.error = null;
    },
    setFilterStatus: (state, action) => {
      state.filters.status = action.payload;
      state.pageCache = {};
    },
  },
});

export const {
  fetchAppointmentsRequest, fetchAppointmentsSuccess, fetchAppointmentsFailure,
  serveFromCache, prefetchPageRequest, prefetchPageSuccess, prefetchPageFailure,
  invalidatePageCache,
  bookAppointmentRequest, bookAppointmentSuccess, bookAppointmentFailure, resetBookingState,
  updateStatusRequest, updateStatusSuccess, updateStatusFailure,
  cancelAppointmentRequest, cancelAppointmentSuccess, cancelAppointmentFailure,
  checkSlotConflictRequest, checkSlotConflictSuccess, checkSlotConflictFailure, resetConflictCheck,
  setOnlineStatus, enqueueOfflineAction, setDrainingQueue, dequeueOfflineAction, clearOfflineQueue,
  setSelectedAppointment, clearAppointmentError, setFilterStatus,
} = appointmentSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectAppointmentList        = (s) => s.appointments.list;
export const selectAppointmentMeta        = (s) => s.appointments.meta;
export const selectAppointmentFilters     = (s) => s.appointments.filters;
export const selectAppointmentLoading     = (s) => s.appointments.loading;
export const selectAppointmentPageCache   = (s) => s.appointments.pageCache;
export const selectAppointmentPrefetching = (s) => s.appointments.prefetching;
export const selectAppointmentError       = (s) => s.appointments.error;

export default appointmentSlice.reducer;
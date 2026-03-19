import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  pagination: {
    total: 0,
    page: 1,
    per_page: 15,
    total_pages: 0,
  },
  selectedAppointment: null,

  loading: false,
  rowLoading: {},
  error: null,

  filters: {
    status: '',
    page: 1,
    perPage: 15,
  },

  prefetchedPages: {},

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
      state.loading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchAppointmentsSuccess: (state, action) => {
      const { appointments, pagination } = action.payload;
      state.list = appointments;
      state.pagination = pagination;
      state.loading = false;
      state.error = null;
      state.prefetchedPages[pagination.page] = appointments;
    },
    fetchAppointmentsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ── Prefetch ────────────────────────────────────────────
    prefetchPageRequest: (state) => {
      // silent — no loading state change
    },
    prefetchPageSuccess: (state, action) => {
      const { page, appointments } = action.payload;
      state.prefetchedPages[page] = appointments;
    },
    serveFromPrefetchCache: (state, action) => {
      const { page } = action.payload;
      const cached = state.prefetchedPages[page];
      if (cached) {
        state.list = cached;
        state.filters.page = page;
        state.pagination = { ...state.pagination, page };
      }
    },
    invalidatePrefetchCache: (state) => {
      state.prefetchedPages = {};
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
      state.prefetchedPages = {};
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
      state.prefetchedPages = {};
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
      state.prefetchedPages = {};
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
      state.filters.page = 1;
      state.prefetchedPages = {};
    },
  },
});

export const {
  fetchAppointmentsRequest, fetchAppointmentsSuccess, fetchAppointmentsFailure,
  prefetchPageRequest, prefetchPageSuccess, serveFromPrefetchCache, invalidatePrefetchCache,
  bookAppointmentRequest, bookAppointmentSuccess, bookAppointmentFailure, resetBookingState,
  updateStatusRequest, updateStatusSuccess, updateStatusFailure,
  cancelAppointmentRequest, cancelAppointmentSuccess, cancelAppointmentFailure,
  checkSlotConflictRequest, checkSlotConflictSuccess, checkSlotConflictFailure, resetConflictCheck,
  setOnlineStatus, enqueueOfflineAction, setDrainingQueue, dequeueOfflineAction, clearOfflineQueue,
  setSelectedAppointment, clearAppointmentError, setFilterStatus,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  invoices:        [],
  selectedInvoice: null,

  summary: {
    total_invoices:     0,
    paid:               0,
    unpaid:             0,
    pending:            0,
    overdue:            0,
    cancelled:          0,
    revenue_this_month: 0,
    total_revenue:      0,
    total_billed:       0,
    total_collected:    0,
  },

  meta: {
    total:    0,
    page:     1,
    per_page: 10,
    last_page: 1,
  },

  filters: {
    search:    '',
    status:    null,
    date_from: null,
    date_to:   null,
  },

  listLoading:    false,
  detailLoading:  false,
  formLoading:    false,
  summaryLoading: false,
  prefetched:     false,

  error:          null,
  successMessage: null,

  offlineQueue: [],
  isOnline:     true,
  isFlushing:   false,
};

// ── Helper: adjust summary counters when a status changes ─────────────────
// oldStatus → decrement its bucket; newStatus → increment its bucket
function adjustSummary(summary, oldStatus, newStatus) {
  const s = { ...summary };

  // Decrement old bucket
  if (oldStatus === 'paid')      s.paid      = Math.max(0, (s.paid      || 0) - 1);
  if (oldStatus === 'pending')   s.pending   = Math.max(0, (s.pending   || 0) - 1);
  if (oldStatus === 'overdue')   s.overdue   = Math.max(0, (s.overdue   || 0) - 1);
  if (oldStatus === 'cancelled') s.cancelled = Math.max(0, (s.cancelled || 0) - 1);
  if (['pending', 'overdue', 'unpaid'].includes(oldStatus)) {
    s.unpaid = Math.max(0, (s.unpaid || 0) - 1);
  }

  // Increment new bucket
  if (newStatus === 'paid')      s.paid      = (s.paid      || 0) + 1;
  if (newStatus === 'pending')   s.pending   = (s.pending   || 0) + 1;
  if (newStatus === 'overdue')   s.overdue   = (s.overdue   || 0) + 1;
  if (newStatus === 'cancelled') s.cancelled = (s.cancelled || 0) + 1;
  if (['pending', 'overdue', 'unpaid'].includes(newStatus)) {
    s.unpaid = (s.unpaid || 0) + 1;
  }

  return s;
}

const billingSlice = createSlice({
  name: 'billing',
  initialState,

  reducers: {

    // ── Fetch Summary ─────────────────────────────────────────────────────
    fetchBillingSummaryRequest: (state) => {
      state.summaryLoading = true;
      state.error          = null;
    },
    fetchBillingSummarySuccess: (state, action) => {
      // Backend now returns the correct keys: paid, unpaid, pending, overdue
      state.summary        = { ...state.summary, ...action.payload };
      state.summaryLoading = false;
      state.prefetched     = true;
    },
    fetchBillingSummaryFailure: (state, action) => {
      state.summaryLoading = false;
      state.error          = action.payload;
    },

    // ── Fetch Invoice List ────────────────────────────────────────────────
    fetchInvoicesRequest: (state, action) => {
      state.listLoading = true;
      state.error       = null;
      if (action.payload?.filters) {
        state.filters = { ...state.filters, ...action.payload.filters };
      }
    },
    fetchInvoicesSuccess: (state, action) => {
      state.invoices    = action.payload.data;
      state.meta        = action.payload.meta;
      state.listLoading = false;
    },
    fetchInvoicesFailure: (state, action) => {
      state.listLoading = false;
      state.error       = action.payload;
    },

    // ── Fetch Single Invoice ──────────────────────────────────────────────
    fetchInvoiceByIdRequest: (state) => {
      state.detailLoading = true;
      state.error         = null;
    },
    fetchInvoiceByIdSuccess: (state, action) => {
      state.selectedInvoice = action.payload;
      state.detailLoading   = false;
    },
    fetchInvoiceByIdFailure: (state, action) => {
      state.detailLoading = false;
      state.error         = action.payload;
    },

    // ── Create Invoice ────────────────────────────────────────────────────
    createInvoiceRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    createInvoiceSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Invoice created successfully.';
      state.invoices.unshift(action.payload);
      state.meta.total             += 1;
      state.summary.total_invoices  = (state.summary.total_invoices || 0) + 1;
      // New invoice starts as 'pending' (not 'unpaid')
      state.summary.pending = (state.summary.pending || 0) + 1;
      state.summary.unpaid  = (state.summary.unpaid  || 0) + 1;
    },
    createInvoiceFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Update Invoice Status ─────────────────────────────────────────────
    updateInvoiceStatusRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    updateInvoiceStatusSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = `Invoice marked as ${action.payload.status}.`;

      // Find old status before overwriting the list
      const idx = state.invoices.findIndex((inv) => inv.id === action.payload.id);
      const oldStatus = idx !== -1 ? state.invoices[idx].status : null;
      const newStatus = action.payload.status;

      // Update in list
      if (idx !== -1) state.invoices[idx] = action.payload;

      // Update detail view
      if (state.selectedInvoice?.id === action.payload.id) {
        state.selectedInvoice = action.payload;
      }

      // FIX: Adjust summary counters based on the status transition
      if (oldStatus && oldStatus !== newStatus) {
        state.summary = adjustSummary(state.summary, oldStatus, newStatus);
      }
    },
    updateInvoiceStatusFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Delete Invoice ────────────────────────────────────────────────────
    deleteInvoiceRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    deleteInvoiceSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Invoice deleted.';

      // Find old status before removing
      const removed = state.invoices.find((inv) => inv.id === action.payload);
      const oldStatus = removed?.status || null;

      state.invoices   = state.invoices.filter((inv) => inv.id !== action.payload);
      state.meta.total = Math.max(0, state.meta.total - 1);
      state.summary.total_invoices = Math.max(0, (state.summary.total_invoices || 0) - 1);

      // Decrement the old status counter
      if (oldStatus) {
        state.summary = adjustSummary(state.summary, oldStatus, '__deleted__');
      }
    },
    deleteInvoiceFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Offline Queue ─────────────────────────────────────────────────────
    enqueueOfflineAction: (state, action) => {
      state.offlineQueue.push(action.payload);
    },
    dequeueOfflineAction: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter((item) => item.id !== action.payload);
    },
    flushOfflineQueueStart: (state) => { state.isFlushing = true;  },
    flushOfflineQueueEnd:   (state) => { state.isFlushing = false; },
    setOnlineStatus:        (state, action) => { state.isOnline = action.payload; },
    incrementQueueRetry: (state, action) => {
      const item = state.offlineQueue.find((q) => q.id === action.payload);
      if (item) item.retries = (item.retries || 0) + 1;
    },

    // ── UI Helpers ────────────────────────────────────────────────────────
    setSelectedInvoice:  (state, action) => { state.selectedInvoice = action.payload; },
    clearSelectedInvoice:(state)         => { state.selectedInvoice = null; },
    setFilters:  (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    resetFilters:(state)         => { state.filters = initialState.filters; },
    clearSuccess:(state)         => { state.successMessage = null; },
    clearError:  (state)         => { state.error = null; },
  },
});

export const {
  fetchBillingSummaryRequest,
  fetchBillingSummarySuccess,
  fetchBillingSummaryFailure,
  fetchInvoicesRequest,
  fetchInvoicesSuccess,
  fetchInvoicesFailure,
  fetchInvoiceByIdRequest,
  fetchInvoiceByIdSuccess,
  fetchInvoiceByIdFailure,
  createInvoiceRequest,
  createInvoiceSuccess,
  createInvoiceFailure,
  updateInvoiceStatusRequest,
  updateInvoiceStatusSuccess,
  updateInvoiceStatusFailure,
  deleteInvoiceRequest,
  deleteInvoiceSuccess,
  deleteInvoiceFailure,
  enqueueOfflineAction,
  dequeueOfflineAction,
  flushOfflineQueueStart,
  flushOfflineQueueEnd,
  setOnlineStatus,
  incrementQueueRetry,
  setSelectedInvoice,
  clearSelectedInvoice,
  setFilters,
  resetFilters,
  clearSuccess,
  clearError,
} = billingSlice.actions;

export default billingSlice.reducer;
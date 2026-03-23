import { createSlice } from '@reduxjs/toolkit';

/**
 * billingSlice — Module 11: Billing & Payments
 *
 * Follows the exact same pattern as patientSlice (Module 8).
 *
 * State shape:
 *   invoices        → paginated invoice array (current page)
 *   selectedInvoice → currently viewed invoice (with line items)
 *   summary         → { total_invoices, paid, unpaid, overdue, revenue_this_month }
 *   meta            → { total, page, per_page, last_page }
 *   filters         → { search, status, date_from, date_to }
 *   listLoading     → skeleton for invoice table
 *   detailLoading   → skeleton for invoice detail drawer
 *   formLoading     → spinner for create / status-update
 *   summaryLoading  → spinner for summary cards
 *   prefetched      → summary fetched once per session
 *   error           → last error string
 *   successMessage  → shown after CUD actions
 *   offlineQueue    → pending mutations when offline
 *   isOnline        → navigator.onLine mirror
 *   isFlushing      → queue draining
 */

const initialState = {
  invoices:        [],
  selectedInvoice: null,

  summary: {
    total_invoices:     0,
    paid:               0,
    unpaid:             0,
    overdue:            0,
    revenue_this_month: 0,
    total_revenue:      0,
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

  // ── Offline Queue ────────────────────────────────────────────────────────
  // Each entry: { id (uuid), type: 'create'|'updateStatus'|'delete', payload, timestamp, retries }
  offlineQueue: [],
  isOnline:     true,
  isFlushing:   false,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,

  reducers: {

    // ── Fetch Summary (prefetch on mount) ─────────────────────────────────
    fetchBillingSummaryRequest: (state) => {
      state.summaryLoading = true;
      state.error          = null;
    },
    fetchBillingSummarySuccess: (state, action) => {
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
      state.meta.total    += 1;
      state.summary.total_invoices += 1;
      state.summary.unpaid         += 1;
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

      // Update in list
      const idx = state.invoices.findIndex((inv) => inv.id === action.payload.id);
      if (idx !== -1) state.invoices[idx] = action.payload;

      // Update detail view
      if (state.selectedInvoice?.id === action.payload.id) {
        state.selectedInvoice = action.payload;
      }
    },
    updateInvoiceStatusFailure: (state, action) => {
      state.formLoading = false;
      state.error       = action.payload;
    },

    // ── Delete Invoice (Admin only) ───────────────────────────────────────
    deleteInvoiceRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    deleteInvoiceSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Invoice deleted.';
      state.invoices       = state.invoices.filter((inv) => inv.id !== action.payload);
      state.meta.total     = Math.max(0, state.meta.total - 1);
      state.summary.total_invoices = Math.max(0, state.summary.total_invoices - 1);
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

/**
 * billingSlice.js  (UPDATED — adds serveFromCache + prefetchPage actions)
 * ─────────────────────────────────────────────────────────────────────────────
 * Minimal delta from original:
 *   • pageCache state field
 *   • serveFromCache, prefetchPageRequest/Success/Failure, invalidatePageCache
 *   • fetchInvoicesSuccess now accepts { data, meta, cacheKey }
 *   • All mutation success handlers call pageCache = {}
 */

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
    per_page: 5,
    last_page: 1,
  },

  filters: {
    search:    '',
    status:    null,
    date_from: null,
    date_to:   null,
  },

  // ── Page cache ────────────────────────────────────────────────────────────
  pageCache:   {},
  prefetching: false,

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

function adjustSummary(summary, oldStatus, newStatus) {
  const s = { ...summary };
  if (oldStatus === 'paid')      s.paid      = Math.max(0, (s.paid      || 0) - 1);
  if (oldStatus === 'pending')   s.pending   = Math.max(0, (s.pending   || 0) - 1);
  if (oldStatus === 'overdue')   s.overdue   = Math.max(0, (s.overdue   || 0) - 1);
  if (oldStatus === 'cancelled') s.cancelled = Math.max(0, (s.cancelled || 0) - 1);
  if (['pending', 'overdue', 'unpaid'].includes(oldStatus)) {
    s.unpaid = Math.max(0, (s.unpaid || 0) - 1);
  }
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

    // ── Summary ───────────────────────────────────────────────────────────────
    fetchBillingSummaryRequest: (state) => { state.summaryLoading = true; state.error = null; },
    fetchBillingSummarySuccess: (state, action) => {
      state.summary        = { ...state.summary, ...action.payload };
      state.summaryLoading = false;
      state.prefetched     = true;
    },
    fetchBillingSummaryFailure: (state, action) => {
      state.summaryLoading = false;
      state.error          = action.payload;
    },

    // ── Invoice List ──────────────────────────────────────────────────────────
    fetchInvoicesRequest: (state, action) => {
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
    fetchInvoicesSuccess: (state, action) => {
      const { data, meta, cacheKey } = action.payload;
      state.invoices    = data;
      state.meta        = meta;
      state.listLoading = false;
      if (cacheKey) state.pageCache[cacheKey] = { data, meta };
    },
    fetchInvoicesFailure: (state, action) => {
      state.listLoading = false;
      state.error       = action.payload;
    },

    // ── Cache operations ──────────────────────────────────────────────────────
    serveFromCache: (state, action) => {
      const { data, meta } = action.payload;
      state.invoices    = data;
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

    // ── Single Invoice ────────────────────────────────────────────────────────
    fetchInvoiceByIdRequest: (state) => { state.detailLoading = true; state.error = null; },
    fetchInvoiceByIdSuccess: (state, action) => {
      state.selectedInvoice = action.payload;
      state.detailLoading   = false;
    },
    fetchInvoiceByIdFailure: (state, action) => {
      state.detailLoading = false;
      state.error         = action.payload;
    },

    // ── Create ────────────────────────────────────────────────────────────────
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
      state.summary.pending = (state.summary.pending || 0) + 1;
      state.summary.unpaid  = (state.summary.unpaid  || 0) + 1;
      state.pageCache = {};
    },
    createInvoiceFailure: (state, action) => { state.formLoading = false; state.error = action.payload; },

    // ── Update Status ─────────────────────────────────────────────────────────
    updateInvoiceStatusRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    updateInvoiceStatusSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = `Invoice marked as ${action.payload.status}.`;
      const idx       = state.invoices.findIndex((inv) => inv.id === action.payload.id);
      const oldStatus = idx !== -1 ? state.invoices[idx].status : null;
      const newStatus = action.payload.status;
      if (idx !== -1) state.invoices[idx] = action.payload;
      if (state.selectedInvoice?.id === action.payload.id) state.selectedInvoice = action.payload;
      if (oldStatus && oldStatus !== newStatus) {
        state.summary = adjustSummary(state.summary, oldStatus, newStatus);
      }
      state.pageCache = {};
    },
    updateInvoiceStatusFailure: (state, action) => { state.formLoading = false; state.error = action.payload; },

    // ── Delete ────────────────────────────────────────────────────────────────
    deleteInvoiceRequest: (state) => {
      state.formLoading    = true;
      state.error          = null;
      state.successMessage = null;
    },
    deleteInvoiceSuccess: (state, action) => {
      state.formLoading    = false;
      state.successMessage = 'Invoice deleted.';
      const removed   = state.invoices.find((inv) => inv.id === action.payload);
      const oldStatus = removed?.status || null;
      state.invoices   = state.invoices.filter((inv) => inv.id !== action.payload);
      state.meta.total = Math.max(0, state.meta.total - 1);
      state.summary.total_invoices = Math.max(0, (state.summary.total_invoices || 0) - 1);
      if (oldStatus) state.summary = adjustSummary(state.summary, oldStatus, '__deleted__');
      state.pageCache = {};
    },
    deleteInvoiceFailure: (state, action) => { state.formLoading = false; state.error = action.payload; },

    // ── Offline ───────────────────────────────────────────────────────────────
    enqueueOfflineAction:  (state, action) => { state.offlineQueue.push(action.payload); },
    dequeueOfflineAction:  (state, action) => {
      state.offlineQueue = state.offlineQueue.filter((i) => i.id !== action.payload);
    },
    flushOfflineQueueStart:(state) => { state.isFlushing = true;  },
    flushOfflineQueueEnd:  (state) => { state.isFlushing = false; },
    setOnlineStatus:       (state, action) => { state.isOnline = action.payload; },
    incrementQueueRetry:   (state, action) => {
      const item = state.offlineQueue.find((q) => q.id === action.payload);
      if (item) item.retries = (item.retries || 0) + 1;
    },

    // ── UI Helpers ────────────────────────────────────────────────────────────
    setSelectedInvoice:   (state, action) => { state.selectedInvoice = action.payload; },
    clearSelectedInvoice: (state)         => { state.selectedInvoice = null; },
    setFilters:  (state, action) => {
      state.filters   = { ...state.filters, ...action.payload };
      state.pageCache = {};
    },
    resetFilters:(state) => { state.filters = initialState.filters; state.pageCache = {}; },
    clearSuccess:(state) => { state.successMessage = null; },
    clearError:  (state) => { state.error = null; },
  },
});

export const {
  fetchBillingSummaryRequest, fetchBillingSummarySuccess, fetchBillingSummaryFailure,
  fetchInvoicesRequest,       fetchInvoicesSuccess,       fetchInvoicesFailure,
  serveFromCache,
  prefetchPageRequest,  prefetchPageSuccess,  prefetchPageFailure,
  invalidatePageCache,
  fetchInvoiceByIdRequest,    fetchInvoiceByIdSuccess,    fetchInvoiceByIdFailure,
  createInvoiceRequest,       createInvoiceSuccess,       createInvoiceFailure,
  updateInvoiceStatusRequest, updateInvoiceStatusSuccess, updateInvoiceStatusFailure,
  deleteInvoiceRequest,       deleteInvoiceSuccess,       deleteInvoiceFailure,
  enqueueOfflineAction, dequeueOfflineAction,
  flushOfflineQueueStart, flushOfflineQueueEnd,
  setOnlineStatus, incrementQueueRetry,
  setSelectedInvoice, clearSelectedInvoice,
  setFilters, resetFilters, clearSuccess, clearError,
} = billingSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectInvoiceList          = (s) => s.billing.invoices;
export const selectSelectedInvoice      = (s) => s.billing.selectedInvoice;
export const selectBillingSummary       = (s) => s.billing.summary;
export const selectBillingMeta          = (s) => s.billing.meta;
export const selectBillingFilters       = (s) => s.billing.filters;
export const selectBillingPageCache     = (s) => s.billing.pageCache;
export const selectBillingPrefetching   = (s) => s.billing.prefetching;
export const selectBillingListLoading   = (s) => s.billing.listLoading;
export const selectBillingDetailLoading = (s) => s.billing.detailLoading;
export const selectBillingFormLoading   = (s) => s.billing.formLoading;
export const selectBillingSummaryLoading= (s) => s.billing.summaryLoading;
export const selectBillingPrefetched    = (s) => s.billing.prefetched;
export const selectBillingError         = (s) => s.billing.error;
export const selectBillingSuccess       = (s) => s.billing.successMessage;
export const selectBillingOfflineQueue  = (s) => s.billing.offlineQueue;
export const selectBillingIsOnline      = (s) => s.billing.isOnline;
export const selectBillingIsFlushing    = (s) => s.billing.isFlushing;

export default billingSlice.reducer;
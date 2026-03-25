/**
 * billingSaga.js  (UPDATED — Prefetch Pagination)
 * ─────────────────────────────────────────────────────────────────────────────
 * Key changes from original:
 *   • Cache-aware fetchInvoices with prefetch of next page
 *   • All offline mutations route through global offlineSlice
 *   • eventChannel network watcher replaced by listening to global
 *     offline/setOnlineStatus dispatches
 *
 * NOTE: The global offlineSaga now owns the network channel. billingSaga
 * just needs to read selectIsOnline from offlineSlice.
 */

import {
  all,
  call,
  put,
  select,
  takeLatest,
  fork,
  delay,
} from 'redux-saga/effects';
import { v4 as uuidv4 } from 'uuid';

import {
  fetchBillingSummaryAPI,
  fetchInvoiceListAPI,
  fetchInvoiceByIdAPI,
  createInvoiceAPI,
  updateInvoiceStatusAPI,
  deleteInvoiceAPI,
} from './billingAPI';

import {
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
  // NEW: cache actions
  serveFromCache,
  prefetchPageRequest,
  prefetchPageSuccess,
  prefetchPageFailure,
  selectBillingPageCache,
  invalidatePageCache,
} from './billingSlice';

import { enqueueAction, selectIsOnline } from '../offline/offlineSlice';
import pageCache from '../../services/pageCacheManager';

// ── Constants ─────────────────────────────────────────────────────────────────
const PREFETCH_DELAY_MS = 350;

// ── Track in-flight prefetch pages to avoid duplicate API calls ───────────────
const inFlightPrefetches = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const extractInvoice = (response) =>
  response?.data?.invoice ?? response?.data ?? response;

const normaliseMeta = (rawPagination, params) => ({
  total:    rawPagination.total      ?? 0,
  page:     rawPagination.page       ?? params.page,
  per_page: rawPagination.per_page   ?? params.per_page,
  last_page:rawPagination.total_pages ?? rawPagination.last_page ?? 1,
});

function buildParams(actionPayload, meta, filters) {
  return {
    page:     actionPayload?.page     ?? meta.page,
    per_page: actionPayload?.per_page ?? meta.per_page,
    ...filters,
    ...(actionPayload?.filters ?? {}),
  };
}

// ── Fetch Billing Summary ─────────────────────────────────────────────────────
function* handleFetchBillingSummary() {
  try {
    const response = yield call(fetchBillingSummaryAPI);
    const summary  = response?.data || response;
    yield put(fetchBillingSummarySuccess(summary));
  } catch (error) {
    yield put(fetchBillingSummaryFailure(errMsg(error, 'Failed to load billing summary.')));
  }
}

// ── Fetch Invoices (cache-aware) ───────────────────────────────────────────────
function* handleFetchInvoices(action) {
  try {
    const isPrefetch = !!action.payload?._prefetch;
    const filters = yield select((s) => s.billing.filters);
    const meta    = yield select((s) => s.billing.meta);
    const params  = buildParams(action.payload, meta, filters);

    const cacheKey = pageCache.makeKey('billing', params);

    // ── Cache hit: check Redux pageCache ────────────────────────────────────────
    const reduxCache = yield select(selectBillingPageCache);
    const cached = reduxCache[cacheKey];
    if (cached && !action.payload?.forceRefresh) {
      // Prefetch must not overwrite the visible list.
      if (isPrefetch) return;

      yield put(serveFromCache(cached));
      yield fork(prefetchNextInvoicePage, params, cached.meta);
      return;
    }

    // ── Silent prefetch: fetch + store in pageCache only ─────────────────────
    if (isPrefetch) {
      if (inFlightPrefetches.has(cacheKey)) return;
      inFlightPrefetches.add(cacheKey);

      yield put(prefetchPageRequest());
      try {
        const response = yield call(fetchInvoiceListAPI, params);
        const payload  = response?.data || response;

        const invoiceList   = payload.invoices ?? payload.data ?? [];
        const rawPagination = payload.pagination ?? payload.meta ?? {};
        const normMeta      = normaliseMeta(rawPagination, params);

        yield put(prefetchPageSuccess({ cacheKey, data: invoiceList, meta: normMeta }));
      } catch {
        yield put(prefetchPageFailure());
      } finally {
        inFlightPrefetches.delete(cacheKey);
      }
      return;
    }

    // ── API fetch ─────────────────────────────────────────────────────────
    const response = yield call(fetchInvoiceListAPI, params);
    const payload  = response?.data || response;

    const invoiceList   = payload.invoices ?? payload.data ?? [];
    const rawPagination = payload.pagination ?? payload.meta ?? {};
    const normMeta      = normaliseMeta(rawPagination, params);

    yield put(fetchInvoicesSuccess({ data: invoiceList, meta: normMeta, cacheKey }));

    yield delay(PREFETCH_DELAY_MS);
    yield fork(prefetchNextInvoicePage, params, normMeta);

  } catch (error) {
    yield put(fetchInvoicesFailure(errMsg(error, 'Failed to load invoices.')));
  }
}

// ── Prefetch next invoice page ────────────────────────────────────────────
function* prefetchNextInvoicePage(currentParams, currentMeta) {
  const nextPage = currentMeta.page + 1;
  if (nextPage > currentMeta.last_page) return;

  const nextParams = { ...currentParams, page: nextPage };
  const cacheKey   = pageCache.makeKey('billing', nextParams);

  // ── Dedup: skip if already in Redux cache or in-flight ────────────────
  const reduxCache = yield select(selectBillingPageCache);
  if (reduxCache[cacheKey]) return;

  // Check in-flight set to avoid duplicate API calls
  if (inFlightPrefetches.has(cacheKey)) return;
  inFlightPrefetches.add(cacheKey);

  yield put(prefetchPageRequest());
  try {
    const response = yield call(fetchInvoiceListAPI, nextParams);
    const payload  = response?.data || response;

    const invoiceList   = payload.invoices ?? payload.data ?? [];
    const rawPagination = payload.pagination ?? payload.meta ?? {};
    const normMeta      = normaliseMeta(rawPagination, nextParams);

    yield put(prefetchPageSuccess({ cacheKey, data: invoiceList, meta: normMeta }));
  } catch {
    yield put(prefetchPageFailure());
  } finally {
    inFlightPrefetches.delete(cacheKey);
  }
}

// ── Fetch Single Invoice ───────────────────────────────────────────────────────
function* handleFetchInvoiceById(action) {
  try {
    const response = yield call(fetchInvoiceByIdAPI, action.payload);
    yield put(fetchInvoiceByIdSuccess(extractInvoice(response)));
  } catch (error) {
    yield put(fetchInvoiceByIdFailure(errMsg(error, 'Failed to load invoice details.')));
  }
}

// ── Create Invoice ────────────────────────────────────────────────────────────
function* handleCreateInvoice(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'billing',
      type:      'create',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(createInvoiceFailure(
      'You are offline. This invoice will be created when reconnected.'
    ));
    return;
  }

  try {
    const response = yield call(createInvoiceAPI, action.payload);
    yield put(createInvoiceSuccess(extractInvoice(response)));
    yield put(invalidatePageCache());
    yield all([
      put(fetchInvoicesRequest({ page: 1, forceRefresh: true })),
      put(fetchBillingSummaryRequest()),
    ]);
  } catch (error) {
    yield put(createInvoiceFailure(errMsg(error, 'Failed to create invoice.')));
  }
}

// ── Update Invoice Status ─────────────────────────────────────────────────────
function* handleUpdateInvoiceStatus(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'billing',
      type:      'updateStatus',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(updateInvoiceStatusFailure(
      'You are offline. This status change will sync when reconnected.'
    ));
    return;
  }

  try {
    const response = yield call(updateInvoiceStatusAPI, action.payload);
    yield put(updateInvoiceStatusSuccess(extractInvoice(response)));
    yield put(invalidatePageCache());
    yield put(fetchBillingSummaryRequest());
  } catch (error) {
    yield put(updateInvoiceStatusFailure(errMsg(error, 'Failed to update invoice status.')));
  }
}

// ── Delete Invoice ────────────────────────────────────────────────────────────
function* handleDeleteInvoice(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'billing',
      type:      'delete',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(deleteInvoiceFailure(
      'You are offline. This deletion will sync when reconnected.'
    ));
    return;
  }

  try {
    yield call(deleteInvoiceAPI, action.payload);
    yield put(deleteInvoiceSuccess(action.payload));
    yield put(invalidatePageCache());
    yield put(fetchBillingSummaryRequest());
  } catch (error) {
    yield put(deleteInvoiceFailure(errMsg(error, 'Failed to delete invoice.')));
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* billingSaga() {
  yield all([
    takeLatest(fetchBillingSummaryRequest.type, handleFetchBillingSummary),
    takeLatest(fetchInvoicesRequest.type,       handleFetchInvoices),
    takeLatest(fetchInvoiceByIdRequest.type,    handleFetchInvoiceById),
    takeLatest(createInvoiceRequest.type,       handleCreateInvoice),
    takeLatest(updateInvoiceStatusRequest.type, handleUpdateInvoiceStatus),
    takeLatest(deleteInvoiceRequest.type,       handleDeleteInvoice),
  ]);
}
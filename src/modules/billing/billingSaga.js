import {
  all,
  call,
  put,
  select,
  takeLatest,
  fork,
  take,
} from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
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
  enqueueOfflineAction,
  dequeueOfflineAction,
  flushOfflineQueueStart,
  flushOfflineQueueEnd,
  setOnlineStatus,
  incrementQueueRetry,
} from './billingSlice';

// ─── Selectors ────────────────────────────────────────────────────────────────
const selectIsOnline     = (state) => state.billing.isOnline;
const selectOfflineQueue = (state) => state.billing.offlineQueue;
const selectMeta         = (state) => state.billing.meta;
const selectFilters      = (state) => state.billing.filters;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;

// ─── Helper ───────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// ─── Response normalizer ──────────────────────────────────────────────────────
const extractInvoice = (response) =>
  response?.data?.invoice ?? response?.data ?? response;

// ════════════════════════════════════════════════════════════════════════════
// 1. FETCH BILLING SUMMARY (prefetch — fires once per session on mount)
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchBillingSummary() {
  try {
    const response = yield call(fetchBillingSummaryAPI);
    const summary  = response?.data || response;
    yield put(fetchBillingSummarySuccess(summary));
  } catch (error) {
    yield put(fetchBillingSummaryFailure(errMsg(error, 'Failed to load billing summary.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. FETCH INVOICE LIST
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchInvoices(action) {
  try {
    const filters = yield select(selectFilters);
    const meta    = yield select(selectMeta);

    const params = {
      page:     action.payload?.page     ?? meta.page,
      per_page: action.payload?.per_page ?? meta.per_page,
      ...filters,
      ...(action.payload?.filters ?? {}),
    };

    const response = yield call(fetchInvoiceListAPI, params);
    const payload  = response?.data || response;

    yield put(fetchInvoicesSuccess({
      data: payload.data ?? payload.invoices ?? payload,
      meta: payload.meta ?? payload.pagination ?? {
        total:     payload.total     ?? 0,
        page:      params.page,
        per_page:  params.per_page,
        last_page: payload.last_page ?? 1,
      },
    }));
  } catch (error) {
    yield put(fetchInvoicesFailure(errMsg(error, 'Failed to load invoices.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. FETCH SINGLE INVOICE
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchInvoiceById(action) {
  try {
    const response = yield call(fetchInvoiceByIdAPI, action.payload);
    const invoice  = extractInvoice(response);
    yield put(fetchInvoiceByIdSuccess(invoice));
  } catch (error) {
    yield put(fetchInvoiceByIdFailure(errMsg(error, 'Failed to load invoice details.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. CREATE INVOICE
// ════════════════════════════════════════════════════════════════════════════
function* handleCreateInvoice(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:        uuidv4(),
      type:      'create',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
    }));
    yield put(createInvoiceFailure(
      'You are offline. This invoice will be created when reconnected.'
    ));
    return;
  }

  try {
    const response = yield call(createInvoiceAPI, action.payload);
    const invoice  = extractInvoice(response);
    yield put(createInvoiceSuccess(invoice));
    // Refresh list + summary after creation
    yield all([
      put(fetchInvoicesRequest({ page: 1 })),
      put(fetchBillingSummaryRequest()),
    ]);
  } catch (error) {
    yield put(createInvoiceFailure(errMsg(error, 'Failed to create invoice.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 5. UPDATE INVOICE STATUS
// ════════════════════════════════════════════════════════════════════════════
function* handleUpdateInvoiceStatus(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:        uuidv4(),
      type:      'updateStatus',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
    }));
    yield put(updateInvoiceStatusFailure(
      'You are offline. This status change will sync when reconnected.'
    ));
    return;
  }

  try {
    const response = yield call(updateInvoiceStatusAPI, action.payload);
    const invoice  = extractInvoice(response);
    yield put(updateInvoiceStatusSuccess(invoice));
    // Refresh summary stats after every status change
    yield put(fetchBillingSummaryRequest());
  } catch (error) {
    yield put(updateInvoiceStatusFailure(errMsg(error, 'Failed to update invoice status.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 6. DELETE INVOICE (Admin only — backend also enforces)
// ════════════════════════════════════════════════════════════════════════════
function* handleDeleteInvoice(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:        uuidv4(),
      type:      'delete',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
    }));
    yield put(deleteInvoiceFailure(
      'You are offline. This deletion will sync when reconnected.'
    ));
    return;
  }

  try {
    yield call(deleteInvoiceAPI, action.payload);
    yield put(deleteInvoiceSuccess(action.payload));
    yield put(fetchBillingSummaryRequest());
  } catch (error) {
    yield put(deleteInvoiceFailure(errMsg(error, 'Failed to delete invoice.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 7. OFFLINE QUEUE FLUSH
// ════════════════════════════════════════════════════════════════════════════
function* flushOfflineQueue() {
  yield put(flushOfflineQueueStart());

  const queue = yield select(selectOfflineQueue);

  for (const item of queue) {
    if ((item.retries ?? 0) >= MAX_RETRIES) {
      console.warn('[billingSaga] Dropping stale queue item:', item);
      yield put(dequeueOfflineAction(item.id));
      continue;
    }

    try {
      if (item.type === 'create') {
        const res     = yield call(createInvoiceAPI, item.payload);
        yield put(createInvoiceSuccess(extractInvoice(res)));
      } else if (item.type === 'updateStatus') {
        const res     = yield call(updateInvoiceStatusAPI, item.payload);
        yield put(updateInvoiceStatusSuccess(extractInvoice(res)));
      } else if (item.type === 'delete') {
        yield call(deleteInvoiceAPI, item.payload);
        yield put(deleteInvoiceSuccess(item.payload));
      }
      yield put(dequeueOfflineAction(item.id));
    } catch (err) {
      console.error(`[billingSaga] Queue flush failed (attempt ${(item.retries ?? 0) + 1}):`, err);
      yield put(incrementQueueRetry(item.id));
    }
  }

  yield put(flushOfflineQueueEnd());
  // Refresh both list + summary after full flush
  yield all([
    put(fetchInvoicesRequest({ page: 1 })),
    put(fetchBillingSummaryRequest()),
  ]);
}

// ════════════════════════════════════════════════════════════════════════════
// 8. ONLINE / OFFLINE WATCHER — event-based (zero polling spam)
// ════════════════════════════════════════════════════════════════════════════
function createOnlineChannel() {
  return eventChannel((emit) => {
    const handleOnline  = () => emit(true);
    const handleOffline = () => emit(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
}

function* watchOnlineStatus() {
  const initialStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
  yield put(setOnlineStatus(initialStatus));

  const channel = yield call(createOnlineChannel);

  try {
    while (true) {
      const isOnline = yield take(channel);
      yield put(setOnlineStatus(isOnline));

      if (isOnline) {
        const queue = yield select(selectOfflineQueue);
        if (queue.length > 0) {
          yield call(flushOfflineQueue);
        }
      }
    }
  } finally {
    channel.close();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT BILLING SAGA
// ════════════════════════════════════════════════════════════════════════════
export default function* billingSaga() {
  yield all([
    takeLatest(fetchBillingSummaryRequest.type,    handleFetchBillingSummary),
    takeLatest(fetchInvoicesRequest.type,          handleFetchInvoices),
    takeLatest(fetchInvoiceByIdRequest.type,       handleFetchInvoiceById),
    takeLatest(createInvoiceRequest.type,          handleCreateInvoice),
    takeLatest(updateInvoiceStatusRequest.type,    handleUpdateInvoiceStatus),
    takeLatest(deleteInvoiceRequest.type,          handleDeleteInvoice),
    fork(watchOnlineStatus),
  ]);
}

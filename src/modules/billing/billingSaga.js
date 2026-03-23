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

const selectIsOnline     = (state) => state.billing.isOnline;
const selectOfflineQueue = (state) => state.billing.offlineQueue;
const selectMeta         = (state) => state.billing.meta;
const selectFilters      = (state) => state.billing.filters;

const MAX_RETRIES = 3;

const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const extractInvoice = (response) =>
  response?.data?.invoice ?? response?.data ?? response;

function* handleFetchBillingSummary() {
  try {
    const response = yield call(fetchBillingSummaryAPI);
    const summary  = response?.data || response;
    yield put(fetchBillingSummarySuccess(summary));
  } catch (error) {
    yield put(fetchBillingSummaryFailure(errMsg(error, 'Failed to load billing summary.')));
  }
}

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

    // FIX: correct invoice key + total_pages → last_page normalisation
    const invoiceList    = payload.invoices ?? payload.data ?? [];
    const rawPagination  = payload.pagination ?? payload.meta ?? {};
    const normalisedMeta = {
      total:     rawPagination.total    ?? payload.total    ?? 0,
      page:      rawPagination.page     ?? params.page,
      per_page:  rawPagination.per_page ?? params.per_page,
      last_page: rawPagination.total_pages ?? rawPagination.last_page ?? 1,
    };

    yield put(fetchInvoicesSuccess({ data: invoiceList, meta: normalisedMeta }));
  } catch (error) {
    yield put(fetchInvoicesFailure(errMsg(error, 'Failed to load invoices.')));
  }
}

function* handleFetchInvoiceById(action) {
  try {
    const response = yield call(fetchInvoiceByIdAPI, action.payload);
    yield put(fetchInvoiceByIdSuccess(extractInvoice(response)));
  } catch (error) {
    yield put(fetchInvoiceByIdFailure(errMsg(error, 'Failed to load invoice details.')));
  }
}

function* handleCreateInvoice(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id: uuidv4(), type: 'create', payload: action.payload,
      timestamp: Date.now(), retries: 0,
    }));
    yield put(createInvoiceFailure('You are offline. This invoice will be created when reconnected.'));
    return;
  }

  try {
    const response = yield call(createInvoiceAPI, action.payload);
    yield put(createInvoiceSuccess(extractInvoice(response)));
    yield all([
      put(fetchInvoicesRequest({ page: 1 })),
      put(fetchBillingSummaryRequest()),
    ]);
  } catch (error) {
    yield put(createInvoiceFailure(errMsg(error, 'Failed to create invoice.')));
  }
}

function* handleUpdateInvoiceStatus(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id: uuidv4(), type: 'updateStatus', payload: action.payload,
      timestamp: Date.now(), retries: 0,
    }));
    yield put(updateInvoiceStatusFailure('You are offline. This status change will sync when reconnected.'));
    return;
  }

  try {
    const response = yield call(updateInvoiceStatusAPI, action.payload);
    yield put(updateInvoiceStatusSuccess(extractInvoice(response)));
    yield put(fetchBillingSummaryRequest());
  } catch (error) {
    yield put(updateInvoiceStatusFailure(errMsg(error, 'Failed to update invoice status.')));
  }
}

function* handleDeleteInvoice(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id: uuidv4(), type: 'delete', payload: action.payload,
      timestamp: Date.now(), retries: 0,
    }));
    yield put(deleteInvoiceFailure('You are offline. This deletion will sync when reconnected.'));
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
        const res = yield call(createInvoiceAPI, item.payload);
        yield put(createInvoiceSuccess(extractInvoice(res)));
      } else if (item.type === 'updateStatus') {
        const res = yield call(updateInvoiceStatusAPI, item.payload);
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
  yield all([
    put(fetchInvoicesRequest({ page: 1 })),
    put(fetchBillingSummaryRequest()),
  ]);
}

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
        if (queue.length > 0) yield call(flushOfflineQueue);
      }
    }
  } finally {
    channel.close();
  }
}

export default function* billingSaga() {
  yield all([
    takeLatest(fetchBillingSummaryRequest.type,  handleFetchBillingSummary),
    takeLatest(fetchInvoicesRequest.type,        handleFetchInvoices),
    takeLatest(fetchInvoiceByIdRequest.type,     handleFetchInvoiceById),
    takeLatest(createInvoiceRequest.type,        handleCreateInvoice),
    takeLatest(updateInvoiceStatusRequest.type,  handleUpdateInvoiceStatus),
    takeLatest(deleteInvoiceRequest.type,        handleDeleteInvoice),
    fork(watchOnlineStatus),
  ]);
}
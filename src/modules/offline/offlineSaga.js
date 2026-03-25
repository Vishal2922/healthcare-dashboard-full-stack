/**
 * offlineSaga.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Master saga that:
 * 1. Monitors network status via EventChannel
 * 2. Persists queue to IndexedDB on every enqueue
 * 3. Hydrates Redux from IndexedDB on app start
 * 4. Flushes the queue with exponential backoff when network returns
 * 5. Broadcasts module-specific success/failure actions after sync
 *
 * Exponential backoff:
 * Retry 0 → immediate
 * Retry 1 → 2s
 * Retry 2 → 4s
 * Retry 3 → 8s  (then dropped if MAX_RETRIES exceeded)
 *
 * Module dispatch table:
 * patients      → createPatientAPI / updatePatientAPI / deletePatientAPI
 * prescriptions → createPrescriptionAPI / updatePrescriptionAPI
 * billing       → createInvoiceAPI / updateInvoiceStatusAPI / deleteInvoiceAPI
 * staff         → createStaffMemberAPI / updateStaffMemberAPI
 */

import {
  all,
  call,
  put,
  select,
  take,
  fork,
  cancel,
  cancelled,
  delay,
} from 'redux-saga/effects';

import { createNetworkChannel, checkOnline } from '../../services/networkMonitor';
import queueManager from '../../services/offlineQueueManager';
import pageCache    from '../../services/pageCacheManager';

import {
  setOnlineStatus,
  enqueueAction,
  markProcessing,
  markSuccess,
  markFailed,
  incrementRetry,
  dropExhaustedItems,
  flushStart,
  flushComplete,
  flushError,
  hydrateQueue,
  selectOfflineQueue,
  selectIsOnline,
} from './offlineSlice';

// ── Module API imports ────────────────────────────────────────────────────────
import {
  createPatientAPI,
  updatePatientAPI,
  deletePatientAPI,
} from '../patients/patientAPI';

import {
  createPrescriptionAPI,
  updatePrescriptionAPI,
} from '../prescriptions/prescriptionAPI';

import {
  createInvoiceAPI,
  updateInvoiceStatusAPI,
  deleteInvoiceAPI,
} from '../billing/billingAPI';

// ── Module success action imports ─────────────────────────────────────────────
import {
  createPatientSuccess,
  updatePatientSuccess,
  deletePatientSuccess,
  fetchPatientsRequest,
  invalidatePageCache as invalidatePatientCache,
} from '../patients/patientSlice';

import {
  createPrescriptionSuccess,
  updatePrescriptionSuccess,
  fetchPrescriptionsRequest,
  invalidatePageCache as invalidatePrescriptionCache,
} from '../prescriptions/prescriptionSlice';

import {
  createInvoiceSuccess,
  updateInvoiceStatusSuccess,
  deleteInvoiceSuccess,
  fetchInvoicesRequest,
  fetchBillingSummaryRequest,
  invalidatePageCache as invalidateBillingCache,
} from '../billing/billingSlice';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_RETRIES  = 3;
const BASE_DELAY   = 1000; // 1 second base for exponential backoff

// ── Helpers ───────────────────────────────────────────────────────────────────
const errMsg = (error) =>
  error?.response?.data?.message || error?.message || 'Sync failed';

const backoffDelay = (retries) =>
  Math.min(BASE_DELAY * Math.pow(2, retries), 30000); // cap at 30s

const mapPatient = (p) => ({
  ...p,
  full_name: p?.name || p?.full_name,
  dob:       p?.date_of_birth || p?.dob,
  is_active: p?.is_active !== undefined ? p.is_active : p?.status === 'active',
});

// ── Dispatch table ────────────────────────────────────────────────────────────
/**
 * Execute a single queued item against its API.
 * Returns the server response.
 * Throws on API error (caller handles retry).
 */
function* executeQueueItem(item) {
  const { module, type, payload } = item;

  switch (module) {

    // ── Patients ────────────────────────────────────────────────────────────
    case 'patients': {
      if (type === 'create') {
        const res = yield call(createPatientAPI, payload);
        const p   = res?.data?.patient ?? res?.data ?? res;
        yield put(createPatientSuccess(mapPatient(p)));
        yield put(invalidatePatientCache());
        yield put(fetchPatientsRequest({ page: 1, forceRefresh: true }));
        return res;
      }
      if (type === 'update') {
        const res = yield call(updatePatientAPI, payload);
        const p   = res?.data?.patient ?? res?.data ?? res;
        yield put(updatePatientSuccess(mapPatient(p)));
        yield put(invalidatePatientCache());
        yield put(fetchPatientsRequest({ page: 1, forceRefresh: true }));
        return res;
      }
      if (type === 'delete') {
        const res = yield call(deletePatientAPI, payload);
        yield put(deletePatientSuccess(payload));
        yield put(invalidatePatientCache());
        yield put(fetchPatientsRequest({ page: 1, forceRefresh: true }));
        return res;
      }
      break;
    }

    // ── Prescriptions ───────────────────────────────────────────────────────
    case 'prescriptions': {
      if (type === 'create') {
        const res = yield call(createPrescriptionAPI, payload);
        yield put(createPrescriptionSuccess(res));
        yield put(invalidatePrescriptionCache());
        yield put(fetchPrescriptionsRequest({ page: 1, forceRefresh: true }));
        return res;
      }
      if (type === 'update') {
        const res = yield call(updatePrescriptionAPI, payload);
        yield put(updatePrescriptionSuccess({
          ...res,
          id:     payload.id,
          status: payload.status,
        }));
        yield put(invalidatePrescriptionCache());
        yield put(fetchPrescriptionsRequest({ page: 1, forceRefresh: true }));
        return res;
      }
      break;
    }

    // ── Billing ─────────────────────────────────────────────────────────────
    case 'billing': {
      if (type === 'create') {
        const res     = yield call(createInvoiceAPI, payload);
        const invoice = res?.data?.invoice ?? res?.data ?? res;
        yield put(createInvoiceSuccess(invoice));
        yield put(invalidateBillingCache());
        yield put(fetchInvoicesRequest({ page: 1, forceRefresh: true }));
        return res;
      }
      if (type === 'updateStatus') {
        const res     = yield call(updateInvoiceStatusAPI, payload);
        const invoice = res?.data?.invoice ?? res?.data ?? res;
        yield put(updateInvoiceStatusSuccess(invoice));
        yield put(invalidateBillingCache());
        yield put(fetchInvoicesRequest({ forceRefresh: true }));
        return res;
      }
      if (type === 'delete') {
        const res = yield call(deleteInvoiceAPI, payload);
        yield put(deleteInvoiceSuccess(payload));
        yield put(invalidateBillingCache());
        yield put(fetchInvoicesRequest({ forceRefresh: true }));
        return res;
      }
      break;
    }

    default:
      throw new Error(`[offlineSaga] Unknown module: ${module}`);
  }
}

// ── Flush a single item with retry logic ─────────────────────────────────────
function* flushItem(item) {
  if ((item.retries ?? 0) >= MAX_RETRIES) {
    console.warn('[offlineSaga] Dropping exhausted item:', item.id, item.module, item.type);
    yield put(markFailed({ id: item.id, errorMessage: 'Max retries exceeded' }));
    yield call([queueManager, 'updateItem'], item.id, { status: 'failed', errorMessage: 'Max retries exceeded' });
    return;
  }

  // Exponential backoff before retry
  if (item.retries > 0) {
    yield delay(backoffDelay(item.retries));
  }

  yield put(markProcessing(item.id));

  try {
    yield call(executeQueueItem, item);
    yield put(markSuccess(item.id));
    yield call([queueManager, 'dequeue'], item.id);
    console.info('[offlineSaga] ✓ Synced:', item.module, item.type, item.id);
  } catch (error) {
    const msg = errMsg(error);
    console.error('[offlineSaga] ✗ Flush failed:', item.id, msg);

    yield put(incrementRetry(item.id));
    yield call([queueManager, 'updateItem'], item.id, {
      retries: (item.retries ?? 0) + 1,
      status:  'pending',
      errorMessage: msg,
    });
  }
}

// ── Flush entire queue ────────────────────────────────────────────────────────
function* flushOfflineQueue() {
  const queue = yield select(selectOfflineQueue);
  const pendingItems = queue.filter((q) => q.status === 'pending');

  if (pendingItems.length === 0) return;

  console.info(`[offlineSaga] Flushing ${pendingItems.length} queued items…`);
  yield put(flushStart());

  try {
    // Process sequentially (FIFO) to maintain data consistency
    for (const item of pendingItems) {
      // Check we're still online before each item
      const isOnline = yield select(selectIsOnline);
      if (!isOnline) {
        console.info('[offlineSaga] Went offline during flush — pausing');
        break;
      }
      yield call(flushItem, item);
    }

    yield put(dropExhaustedItems());
    yield put(flushComplete());

    // Refresh module data after sync
    const remainingQueue = yield select(selectOfflineQueue);
    const syncedModules  = new Set(pendingItems.map((i) => i.module));

    if (syncedModules.has('patients'))      yield put(fetchPatientsRequest({ page: 1 }));
    if (syncedModules.has('prescriptions')) yield put(fetchPrescriptionsRequest());
    if (syncedModules.has('billing')) {
      yield all([
        put(fetchInvoicesRequest({ page: 1 })),
        put(fetchBillingSummaryRequest()),
      ]);
    }

  } catch (error) {
    console.error('[offlineSaga] Flush error:', error);
    yield put(flushError(errMsg(error)));
  }
}

// ── Hydrate queue from IndexedDB on startup ───────────────────────────────────
function* hydrateFromStorage() {
  try {
    yield call([queueManager, 'init']);
    const stored = yield call([queueManager, 'syncToRedux']);
    if (stored.length > 0) {
      console.info(`[offlineSaga] Hydrated ${stored.length} queued items from storage`);
      yield put(hydrateQueue(stored));
    }
  } catch (error) {
    console.warn('[offlineSaga] Hydration failed:', error.message);
  }
}

// ── Watch for enqueue actions to persist to IndexedDB ────────────────────────
function* watchEnqueue() {
  while (true) {
    const action = yield take(enqueueAction.type);
    try {
      yield call([queueManager, 'enqueue'], action.payload);
    } catch (error) {
      console.warn('[offlineSaga] Persist enqueue failed:', error.message);
    }
  }
}

// ── Network watcher — main loop ───────────────────────────────────────────────
function* watchNetwork() {
  const channel = yield call(createNetworkChannel);

  try {
    while (true) {
      const isOnline = yield take(channel);
      yield put(setOnlineStatus(isOnline));

      if (isOnline) {
        console.info('[offlineSaga] Network restored — checking queue…');
        const queue = yield select(selectOfflineQueue);
        const pending = queue.filter((q) => q.status === 'pending');
        if (pending.length > 0) {
          yield call(flushOfflineQueue);
        }
      } else {
        console.info('[offlineSaga] Network lost — queuing mode active');
      }
    }
  } finally {
    if (yield cancelled()) {
      channel.close();
    }
  }
}

// ── Manual flush trigger ──────────────────────────────────────────────────────
function* watchManualFlush() {
  while (true) {
    yield take('offline/manualFlush');
    const isOnline = yield select(selectIsOnline);
    if (isOnline) {
      yield call(flushOfflineQueue);
    }
  }
}

// ── Root offline saga ─────────────────────────────────────────────────────────
export default function* offlineSaga() {
  // Hydrate from storage first
  yield call(hydrateFromStorage);

  // Set initial online status
  yield put(setOnlineStatus(checkOnline()));

  // Fork long-running watchers
  yield all([
    fork(watchNetwork),
    fork(watchEnqueue),
    fork(watchManualFlush),
  ]);
}
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
  fetchPatientListAPI,
  fetchPatientByIdAPI,
  createPatientAPI,
  updatePatientAPI,
  deletePatientAPI,
} from './patientAPI';

import {
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
} from './patientSlice';

// ─── Selectors ────────────────────────────────────────────────────────────────
const selectIsOnline      = (state) => state.patients.isOnline;
const selectOfflineQueue  = (state) => state.patients.offlineQueue;
const selectMeta          = (state) => state.patients.meta;
const selectFilters       = (state) => state.patients.filters;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RETRIES            = 3;
const ONLINE_POLL_INTERVAL   = 5000; // ms

// ─── Helper: extract error message ──────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const mapPatient = (p) => {
  if (!p) return p;
  return {
    ...p,
    full_name: p.name || p.full_name,
    dob: p.date_of_birth || p.dob,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// 1. FETCH PATIENT LIST
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchPatients(action) {
  try {
    const filters = yield select(selectFilters);
    const meta    = yield select(selectMeta);

    const params = {
      page:     action.payload?.page     ?? meta.page,
      per_page: action.payload?.per_page ?? meta.per_page,
      ...filters,
      ...(action.payload?.filters ?? {}),
    };

    const response = yield call(fetchPatientListAPI, params);
    const payload  = response?.data || response;
    
    // Backend returns { patients: [...], pagination: { total, page, per_page, total_pages } }
    const rawPatients = payload.patients || payload.data || [];
    const mappedPatients = rawPatients.map(p => ({
      ...p,
      full_name: p.name || p.full_name,
      dob: p.date_of_birth || p.dob,
    }));

    yield put(
      fetchPatientsSuccess({
        data: mappedPatients,
        meta: payload.pagination ?? payload.meta ?? {
          total:     payload.total     ?? 0,
          page:      params.page,
          per_page:  params.per_page,
          last_page: payload.last_page ?? 1,
        },
      })
    );
  } catch (error) {
    yield put(fetchPatientsFailure(errMsg(error, 'Failed to load patients.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. FETCH SINGLE PATIENT
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchPatientById(action) {
  try {
    const response = yield call(fetchPatientByIdAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    const patient = mapPatient(rawPatient);
    yield put(fetchPatientByIdSuccess(patient));
  } catch (error) {
    yield put(fetchPatientByIdFailure(errMsg(error, 'Failed to load patient details.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. CREATE PATIENT
// ════════════════════════════════════════════════════════════════════════════
function* handleCreatePatient(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:        uuidv4(),
      type:      'create',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
    }));
    yield put(createPatientFailure(
      'You are offline. This registration will sync when reconnected.'
    ));
    return;
  }

  try {
    const response = yield call(createPatientAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    const patient = mapPatient(rawPatient);
    yield put(createPatientSuccess(patient));
    // Refresh list after create so new record appears at top
    yield put(fetchPatientsRequest({ page: 1 }));
  } catch (error) {
    yield put(createPatientFailure(errMsg(error, 'Failed to register patient.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. UPDATE PATIENT
// ════════════════════════════════════════════════════════════════════════════
function* handleUpdatePatient(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:        uuidv4(),
      type:      'update',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
    }));
    yield put(updatePatientFailure(
      'You are offline. This update will sync when reconnected.'
    ));
    return;
  }

  try {
    const response = yield call(updatePatientAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    const patient = mapPatient(rawPatient);
    yield put(updatePatientSuccess(patient));
  } catch (error) {
    yield put(updatePatientFailure(errMsg(error, 'Failed to update patient.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 5. DELETE PATIENT  (Admin only — backend enforces role check)
// ════════════════════════════════════════════════════════════════════════════
function* handleDeletePatient(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:        uuidv4(),
      type:      'delete',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
    }));
    yield put(deletePatientFailure(
      'You are offline. This deletion will sync when reconnected.'
    ));
    return;
  }

  try {
    yield call(deletePatientAPI, action.payload);
    yield put(deletePatientSuccess(action.payload));
  } catch (error) {
    yield put(deletePatientFailure(errMsg(error, 'Failed to delete patient.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 6. PREFETCH META (runs once on module mount via usePatients hook)
//    Patient module has no heavy dropdown reference data (unlike Staff),
//    so we just mark prefetched = true to unblock the UI immediately.
//    Extend here if backend adds /api/patients/options in future.
// ════════════════════════════════════════════════════════════════════════════
function* handlePrefetchPatientsMeta() {
  try {
    // Fire initial page-1 list load in parallel with marking prefetched
    yield all([
      put(fetchPatientsRequest({ page: 1 })),
    ]);
    yield put(prefetchPatientsMetaSuccess());
  } catch (error) {
    yield put(prefetchPatientsMetaFailure(errMsg(error, 'Prefetch failed.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 7. OFFLINE QUEUE FLUSH
//    Drains the offlineQueue in order when connection is restored.
//    Items that exceed MAX_RETRIES are dropped silently.
// ════════════════════════════════════════════════════════════════════════════
function* flushOfflineQueue() {
  yield put(flushOfflineQueueStart());

  const queue = yield select(selectOfflineQueue);

  for (const item of queue) {
    if ((item.retries ?? 0) >= MAX_RETRIES) {
      console.warn('[patientSaga] Dropping stale queue item:', item);
      yield put(dequeueOfflineAction(item.id));
      continue;
    }

    try {
      if (item.type === 'create') {
        const res = yield call(createPatientAPI, item.payload);
        const rawPatient = res?.data?.patient ?? res?.data ?? res;
        yield put(createPatientSuccess(mapPatient(rawPatient)));
      } else if (item.type === 'update') {
        const res = yield call(updatePatientAPI, item.payload);
        const rawPatient = res?.data?.patient ?? res?.data ?? res;
        yield put(updatePatientSuccess(mapPatient(rawPatient)));
      } else if (item.type === 'delete') {
        yield call(deletePatientAPI, item.payload);
        yield put(deletePatientSuccess(item.payload));
      }
      yield put(dequeueOfflineAction(item.id));
    } catch (err) {
      console.error(`[patientSaga] Queue flush failed (attempt ${(item.retries ?? 0) + 1}):`, err);
      yield put(incrementQueueRetry(item.id));
    }
  }

  yield put(flushOfflineQueueEnd());

  // Refresh list after full sync
  yield put(fetchPatientsRequest({ page: 1 }));
}

// ════════════════════════════════════════════════════════════════════════════
// 8. ONLINE / OFFLINE WATCHER (background fork — runs entire app lifetime)
//    Polls navigator.onLine every 5 s, triggers queue flush on reconnect.
// ════════════════════════════════════════════════════════════════════════════
function* watchOnlineStatus() {
  let wasOffline = false;

  while (true) {
    yield delay(ONLINE_POLL_INTERVAL);

    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    yield put(setOnlineStatus(online));

    if (online && wasOffline) {
      const queue = yield select(selectOfflineQueue);
      if (queue.length > 0) {
        yield call(flushOfflineQueue);
      }
    }

    wasOffline = !online;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT PATIENT SAGA
// ════════════════════════════════════════════════════════════════════════════
export default function* patientSaga() {
  yield all([
    takeLatest(fetchPatientsRequest.type,       handleFetchPatients),
    takeLatest(fetchPatientByIdRequest.type,    handleFetchPatientById),
    takeLatest(createPatientRequest.type,       handleCreatePatient),
    takeLatest(updatePatientRequest.type,       handleUpdatePatient),
    takeLatest(deletePatientRequest.type,       handleDeletePatient),
    takeLatest(prefetchPatientsMetaRequest.type, handlePrefetchPatientsMeta),
    // Background online monitor — never cancels
    fork(watchOnlineStatus),
  ]);
}

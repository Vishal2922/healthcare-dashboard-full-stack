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

const selectIsOnline      = (state) => state.patients.isOnline;
const selectOfflineQueue  = (state) => state.patients.offlineQueue;
const selectMeta          = (state) => state.patients.meta;
const selectFilters       = (state) => state.patients.filters;

const MAX_RETRIES          = 3;
const ONLINE_POLL_INTERVAL = 5000;

const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// FIX: added is_active boolean from status string
const mapPatient = (p) => {
  if (!p) return p;
  return {
    ...p,
    full_name: p.name || p.full_name,
    dob: p.date_of_birth || p.dob,
    is_active: p.is_active !== undefined ? p.is_active : (p.status === 'active'),
  };
};

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

    const rawPatients = payload.patients || payload.data || [];
    // FIX: map is_active from status string
    const mappedPatients = rawPatients.map(p => ({
      ...p,
      full_name: p.name || p.full_name,
      dob: p.date_of_birth || p.dob,
      is_active: p.is_active !== undefined ? p.is_active : (p.status === 'active'),
    }));

    // FIX: backend sends total_pages; Redux meta uses last_page — normalise
    const rawPagination = payload.pagination ?? payload.meta ?? {};
    const normalisedMeta = {
      total:     rawPagination.total    ?? payload.total    ?? 0,
      page:      rawPagination.page     ?? params.page,
      per_page:  rawPagination.per_page ?? params.per_page,
      last_page: rawPagination.total_pages ?? rawPagination.last_page ?? 1,
    };

    yield put(fetchPatientsSuccess({ data: mappedPatients, meta: normalisedMeta }));
  } catch (error) {
    yield put(fetchPatientsFailure(errMsg(error, 'Failed to load patients.')));
  }
}

function* handleFetchPatientById(action) {
  try {
    const response   = yield call(fetchPatientByIdAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    yield put(fetchPatientByIdSuccess(mapPatient(rawPatient)));
  } catch (error) {
    yield put(fetchPatientByIdFailure(errMsg(error, 'Failed to load patient details.')));
  }
}

function* handleCreatePatient(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id: uuidv4(), type: 'create', payload: action.payload,
      timestamp: Date.now(), retries: 0,
    }));
    yield put(createPatientFailure('You are offline. This registration will sync when reconnected.'));
    return;
  }

  try {
    const response   = yield call(createPatientAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    yield put(createPatientSuccess(mapPatient(rawPatient)));
    yield put(fetchPatientsRequest({ page: 1 }));
  } catch (error) {
    yield put(createPatientFailure(errMsg(error, 'Failed to register patient.')));
  }
}

function* handleUpdatePatient(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id: uuidv4(), type: 'update', payload: action.payload,
      timestamp: Date.now(), retries: 0,
    }));
    yield put(updatePatientFailure('You are offline. This update will sync when reconnected.'));
    return;
  }

  try {
    const response   = yield call(updatePatientAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    yield put(updatePatientSuccess(mapPatient(rawPatient)));
  } catch (error) {
    yield put(updatePatientFailure(errMsg(error, 'Failed to update patient.')));
  }
}

function* handleDeletePatient(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id: uuidv4(), type: 'delete', payload: action.payload,
      timestamp: Date.now(), retries: 0,
    }));
    yield put(deletePatientFailure('You are offline. This deletion will sync when reconnected.'));
    return;
  }

  try {
    yield call(deletePatientAPI, action.payload);
    yield put(deletePatientSuccess(action.payload));
  } catch (error) {
    yield put(deletePatientFailure(errMsg(error, 'Failed to delete patient.')));
  }
}

function* handlePrefetchPatientsMeta() {
  try {
    yield all([put(fetchPatientsRequest({ page: 1 }))]);
    yield put(prefetchPatientsMetaSuccess());
  } catch (error) {
    yield put(prefetchPatientsMetaFailure(errMsg(error, 'Prefetch failed.')));
  }
}

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
        yield put(createPatientSuccess(mapPatient(res?.data?.patient ?? res?.data ?? res)));
      } else if (item.type === 'update') {
        const res = yield call(updatePatientAPI, item.payload);
        yield put(updatePatientSuccess(mapPatient(res?.data?.patient ?? res?.data ?? res)));
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
  yield put(fetchPatientsRequest({ page: 1 }));
}

function* watchOnlineStatus() {
  let wasOffline = false;
  while (true) {
    yield delay(ONLINE_POLL_INTERVAL);
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    yield put(setOnlineStatus(online));
    if (online && wasOffline) {
      const queue = yield select(selectOfflineQueue);
      if (queue.length > 0) yield call(flushOfflineQueue);
    }
    wasOffline = !online;
  }
}

export default function* patientSaga() {
  yield all([
    takeLatest(fetchPatientsRequest.type,        handleFetchPatients),
    takeLatest(fetchPatientByIdRequest.type,     handleFetchPatientById),
    takeLatest(createPatientRequest.type,        handleCreatePatient),
    takeLatest(updatePatientRequest.type,        handleUpdatePatient),
    takeLatest(deletePatientRequest.type,        handleDeletePatient),
    takeLatest(prefetchPatientsMetaRequest.type, handlePrefetchPatientsMeta),
    fork(watchOnlineStatus),
  ]);
}
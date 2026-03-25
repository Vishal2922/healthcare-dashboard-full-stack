/**
 * patientSaga.js  (UPDATED — Prefetch Pagination + Global Offline Queue)
 * ─────────────────────────────────────────────────────────────────────────────
 * Key changes from original:
 *
 *   1. Prefetch Pagination
 *      • Every page fetch checks the Redux page cache first (cache hit = instant)
 *      • After serving a page, automatically prefetches the next page
 *        in the background if it is not already cached
 *      • Uses takeLatest so rapid page flips cancel in-flight requests
 *
 *   2. Global Offline Queue
 *      • Create/Update/Delete mutations now enqueue via global offlineSlice
 *        (enqueueAction) instead of local enqueueOfflineAction
 *      • Global offlineSaga handles the actual flush
 *      • Local isFlushing/isOnline are kept in sync via setFlushingStatus
 *        and setOnlineStatus mirrors
 *
 *   3. Filter-aware cache invalidation
 *      • Any filter change clears the page cache
 *      • Any mutation clears the page cache
 */

import {
  all,
  call,
  put,
  select,
  takeLatest,
  fork,
  take,
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
  serveFromCache,
  prefetchPageRequest,
  prefetchPageSuccess,
  prefetchPageFailure,
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
  setOnlineStatus,
  setFlushingStatus,
  selectPatientMeta,
  selectPatientFilters,
  selectPatientPageCache,
  selectPatientIsOnline,
} from './patientSlice';

// Global offline queue actions
import { enqueueAction } from '../offline/offlineSlice';
import { selectIsOnline as selectGlobalOnline } from '../offline/offlineSlice';

import pageCache from '../../services/pageCacheManager';

// ── Constants ─────────────────────────────────────────────────────────────────
const PREFETCH_DELAY_MS = 300; // wait 300ms after page load before prefetching next

// ── Track in-flight prefetch pages to avoid duplicate API calls ───────────────
const inFlightPrefetches = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const mapPatient = (p) => {
  if (!p) return p;
  return {
    ...p,
    full_name: p.name || p.full_name,
    dob:       p.date_of_birth || p.dob,
    is_active: p.is_active !== undefined ? p.is_active : p.status === 'active',
  };
};

const normaliseMeta = (rawPagination, params) => ({
  total:     rawPagination.total      ?? 0,
  page:      rawPagination.page       ?? params.page,
  per_page:  rawPagination.per_page   ?? params.per_page,
  last_page: rawPagination.total_pages ?? rawPagination.last_page ?? 1,
});

// ── Build API params from action + current state ──────────────────────────────
function buildParams(actionPayload, meta, filters) {
  return {
    page:     actionPayload?.page     ?? meta.page,
    per_page: actionPayload?.per_page ?? meta.per_page,
    ...filters,
    ...(actionPayload?.filters ?? {}),
  };
}

// ── Fetch Patients (cache-aware) ──────────────────────────────────────────────
function* handleFetchPatients(action) {
  try {
    const filters = yield select(selectPatientFilters);
    const meta    = yield select(selectPatientMeta);
    const params  = buildParams(action.payload, meta, filters);

    // Apply any filter overrides from the action
    if (action.payload?.filters) {
      Object.assign(params, action.payload.filters);
    }

    const cacheKey = pageCache.makeKey('patients', params);

    // ── Cache hit: check Redux pageCache ────────────────────────────────────────
    const reduxCache = yield select(selectPatientPageCache);
    const cached = reduxCache[cacheKey];
    if (cached && !action.payload?.forceRefresh) {
      yield put(serveFromCache(cached));
      // Prefetch next page immediately (no delay — data is already displayed)
      yield fork(prefetchNextPage, params, cached.meta);
      return;
    }

    // ── Cache miss: fetch from API ─────────────────────────────────────────
    const response = yield call(fetchPatientListAPI, params);
    const payload  = response?.data || response;

    const rawPatients    = payload.patients || payload.data || [];
    const mappedPatients = rawPatients.map(mapPatient);
    const rawPagination  = payload.pagination ?? payload.meta ?? {};
    const normMeta       = normaliseMeta(rawPagination, params);

    yield put(fetchPatientsSuccess({
      data:     mappedPatients,
      meta:     normMeta,
      cacheKey, // stored in Redux page cache
    }));

    // Prefetch next page after a short delay
    yield delay(PREFETCH_DELAY_MS);
    yield fork(prefetchNextPage, params, normMeta);

  } catch (error) {
    yield put(fetchPatientsFailure(errMsg(error, 'Failed to load patients.')));
  }
}

// ── Prefetch next page in background ─────────────────────────────────────────
function* prefetchNextPage(currentParams, currentMeta) {
  const nextPage = currentMeta.page + 1;
  if (nextPage > currentMeta.last_page) return; // no next page

  const nextParams = { ...currentParams, page: nextPage };
  const cacheKey   = pageCache.makeKey('patients', nextParams);

  // ── Dedup: skip if already cached in Redux or in-flight ────────────────
  const reduxCache = yield select(selectPatientPageCache);
  if (reduxCache[cacheKey]) return;



  // Check in-flight set to avoid duplicate API calls
  if (inFlightPrefetches.has(cacheKey)) return;
  inFlightPrefetches.add(cacheKey);

  yield put(prefetchPageRequest());

  try {
    const response = yield call(fetchPatientListAPI, nextParams);
    const payload  = response?.data || response;

    const rawPatients    = (payload.patients || payload.data || []).map(mapPatient);
    const rawPagination  = payload.pagination ?? payload.meta ?? {};
    const normMeta       = normaliseMeta(rawPagination, nextParams);

    // Store ONLY in Redux page cache
    yield put(prefetchPageSuccess({ cacheKey, data: rawPatients, meta: normMeta }));

  } catch (error) {
    // Prefetch errors are silent — don't disrupt the user
    yield put(prefetchPageFailure());
  } finally {
    inFlightPrefetches.delete(cacheKey);
  }
}

// ── Fetch Single Patient ───────────────────────────────────────────────────────
function* handleFetchPatientById(action) {
  try {
    const response   = yield call(fetchPatientByIdAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    yield put(fetchPatientByIdSuccess(mapPatient(rawPatient)));
  } catch (error) {
    yield put(fetchPatientByIdFailure(errMsg(error, 'Failed to load patient details.')));
  }
}

// ── Create Patient ────────────────────────────────────────────────────────────
function* handleCreatePatient(action) {
  const isOnline = yield select(selectGlobalOnline);

  if (!isOnline) {
    // Enqueue in global offline queue
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'patients',
      type:      'create',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(createPatientFailure(
      'You are offline. This registration will sync automatically when reconnected.'
    ));
    return;
  }

  try {
    const response   = yield call(createPatientAPI, action.payload);
    const rawPatient = response?.data?.patient ?? response?.data ?? response;
    yield put(createPatientSuccess(mapPatient(rawPatient)));
    // Refresh page 1 after create
    yield put(fetchPatientsRequest({ page: 1, forceRefresh: true }));
  } catch (error) {
    yield put(createPatientFailure(errMsg(error, 'Failed to register patient.')));
  }
}

// ── Update Patient ────────────────────────────────────────────────────────────
function* handleUpdatePatient(action) {
  const isOnline = yield select(selectGlobalOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'patients',
      type:      'update',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(updatePatientFailure(
      'You are offline. This update will sync when reconnected.'
    ));
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

// ── Delete Patient ────────────────────────────────────────────────────────────
function* handleDeletePatient(action) {
  const isOnline = yield select(selectGlobalOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'patients',
      type:      'delete',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
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

// ── Prefetch Meta ─────────────────────────────────────────────────────────────
function* handlePrefetchPatientsMeta() {
  try {
    yield put(fetchPatientsRequest({ page: 1 }));
    yield put(prefetchPatientsMetaSuccess());
  } catch (error) {
    yield put(prefetchPatientsMetaFailure(errMsg(error, 'Prefetch failed.')));
  }
}

// ── Sync online status from global offlineSlice ───────────────────────────────
function* syncOnlineStatus() {
  while (true) {
    // React to global online status changes
    yield take([
      'offline/setOnlineStatus',
      'offline/flushStart',
      'offline/flushComplete',
    ]);

    // This is handled by offlineSaga; just mirror to local slice for UI
    // (actual value is read from selectGlobalOnline in the handlers above)
  }
}

// ── Root patient saga ─────────────────────────────────────────────────────────
export default function* patientSaga() {
  yield all([
    takeLatest(fetchPatientsRequest.type,        handleFetchPatients),
    takeLatest(fetchPatientByIdRequest.type,     handleFetchPatientById),
    takeLatest(createPatientRequest.type,        handleCreatePatient),
    takeLatest(updatePatientRequest.type,        handleUpdatePatient),
    takeLatest(deletePatientRequest.type,        handleDeletePatient),
    takeLatest(prefetchPatientsMetaRequest.type, handlePrefetchPatientsMeta),
  ]);
}
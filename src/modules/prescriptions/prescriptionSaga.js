/**
 * prescriptionSaga.js  (UPDATED — Prefetch Pagination + Global Offline Queue)
 * ─────────────────────────────────────────────────────────────────────────────
 * Key changes from original:
 *   • Adds pagination params and cache-aware fetching
 *   • Prefetches next page in background after every fetch
 *   • Routes mutations through global offlineSlice when offline
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
  fetchPrescriptionsAPI,
  createPrescriptionAPI,
  updatePrescriptionAPI,
} from './prescriptionAPI';

import {
  fetchPrescriptionsRequest,
  fetchPrescriptionsSuccess,
  fetchPrescriptionsFailure,
  serveFromCache,
  prefetchPageRequest,
  prefetchPageSuccess,
  prefetchPageFailure,
  createPrescriptionRequest,
  createPrescriptionSuccess,
  createPrescriptionFailure,
  updatePrescriptionRequest,
  updatePrescriptionSuccess,
  updatePrescriptionFailure,
  selectPrescriptionMeta,
  selectPrescriptionFilters,
  selectPrescriptionPageCache,
} from './prescriptionSlice';

import { enqueueAction, selectIsOnline } from '../offline/offlineSlice';
import pageCache from '../../services/pageCacheManager';

// ── Constants ─────────────────────────────────────────────────────────────────
const PREFETCH_DELAY_MS = 400;
const DEFAULT_PER_PAGE  = 10;

// ── Track in-flight prefetch pages to avoid duplicate API calls ───────────────
const inFlightPrefetches = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const normaliseMeta = (rawPagination, params) => ({
  total:    rawPagination.total      ?? 0,
  page:     rawPagination.page       ?? params.page ?? 1,
  per_page: rawPagination.per_page   ?? params.per_page ?? DEFAULT_PER_PAGE,
  last_page:rawPagination.total_pages ?? rawPagination.last_page ?? 1,
});

function buildParams(actionPayload, meta, filters) {
  return {
    page:     actionPayload?.page     ?? meta?.page     ?? 1,
    per_page: actionPayload?.per_page ?? meta?.per_page ?? DEFAULT_PER_PAGE,
    ...(filters?.patient_id ? { patient_id: filters.patient_id } : {}),
    ...(filters?.status     ? { status: filters.status }         : {}),
    ...(actionPayload?.filters ?? {}),
  };
}

// ── Fetch Prescriptions (cache-aware + paginated) ─────────────────────────────
function* handleFetchPrescriptions(action) {
  try {
    const meta    = yield select(selectPrescriptionMeta);
    const filters = yield select(selectPrescriptionFilters);
    const params  = buildParams(action.payload, meta, filters);

    const cacheKey = pageCache.makeKey('prescriptions', params);

    // ── Cache hit: check Redux pageCache ────────────────────────────────────────
    const reduxCache = yield select(selectPrescriptionPageCache);
    const cached = reduxCache[cacheKey];
    if (cached && !action.payload?.forceRefresh) {
      yield put(serveFromCache(cached));
      yield fork(prefetchNextPrescriptionPage, params, cached.meta);
      return;
    }

    // ── API fetch ─────────────────────────────────────────────────────────
    const response = yield call(fetchPrescriptionsAPI, params);

    // Backend may return array OR { data: [...], pagination: {...} }
    let list, normMeta;

    if (Array.isArray(response)) {
      list     = response;
      normMeta = { total: list.length, page: 1, per_page: list.length, last_page: 1 };
    } else {
      const payload       = response?.data ?? response;
      list                = payload?.data ?? payload?.prescriptions ?? payload ?? [];
      const rawPagination = payload?.pagination ?? payload?.meta ?? {};
      normMeta            = normaliseMeta(rawPagination, params);
    }

    yield put(fetchPrescriptionsSuccess({ data: list, meta: normMeta, cacheKey }));

    yield delay(PREFETCH_DELAY_MS);
    yield fork(prefetchNextPrescriptionPage, params, normMeta);

  } catch (error) {
    yield put(fetchPrescriptionsFailure(errMsg(error, 'Failed to load prescriptions.')));
  }
}

// ── Prefetch next prescription page ───────────────────────────────────────────
function* prefetchNextPrescriptionPage(currentParams, currentMeta) {
  const nextPage = (currentMeta?.page ?? 1) + 1;
  if (nextPage > (currentMeta?.last_page ?? 1)) return;

  const nextParams = { ...currentParams, page: nextPage };
  const cacheKey   = pageCache.makeKey('prescriptions', nextParams);

  // ── Dedup: skip if already in Redux cache or in-flight ────────────────
  const reduxCache = yield select(selectPrescriptionPageCache);
  if (reduxCache[cacheKey]) return;

  // Check in-flight set to avoid duplicate API calls
  if (inFlightPrefetches.has(cacheKey)) return;
  inFlightPrefetches.add(cacheKey);

  yield put(prefetchPageRequest());
  try {
    const response = yield call(fetchPrescriptionsAPI, nextParams);
    let list, normMeta;

    if (Array.isArray(response)) {
      list     = response;
      normMeta = { total: list.length, page: nextPage, per_page: nextParams.per_page, last_page: nextPage };
    } else {
      const payload       = response?.data ?? response;
      list                = payload?.data ?? payload?.prescriptions ?? payload ?? [];
      const rawPagination = payload?.pagination ?? payload?.meta ?? {};
      normMeta            = normaliseMeta(rawPagination, nextParams);
    }

    yield put(prefetchPageSuccess({ cacheKey, data: list, meta: normMeta }));
  } catch {
    yield put(prefetchPageFailure());
  } finally {
    inFlightPrefetches.delete(cacheKey);
  }
}

// ── Create Prescription ────────────────────────────────────────────────────────
function* handleCreatePrescription(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'prescriptions',
      type:      'create',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(createPrescriptionFailure(
      'You are offline. This prescription will sync when reconnected.'
    ));
    return;
  }

  try {
    const data = yield call(createPrescriptionAPI, action.payload);
    yield put(createPrescriptionSuccess(data));
    yield put(fetchPrescriptionsRequest({ forceRefresh: true }));
  } catch (error) {
    yield put(createPrescriptionFailure(errMsg(error, 'Failed to create prescription.')));
  }
}

// ── Update Prescription ────────────────────────────────────────────────────────
function* handleUpdatePrescription(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueAction({
      id:        uuidv4(),
      module:    'prescriptions',
      type:      'update',
      payload:   action.payload,
      timestamp: Date.now(),
      retries:   0,
      status:    'pending',
    }));
    yield put(updatePrescriptionFailure(
      'You are offline. This update will sync when reconnected.'
    ));
    return;
  }

  try {
    const data = yield call(updatePrescriptionAPI, action.payload);
    yield put(updatePrescriptionSuccess({
      ...data,
      id:      action.payload.id,
      status:  action.payload.status,
      message: data?.message || 'Prescription updated successfully.',
    }));
    yield put(fetchPrescriptionsRequest({ forceRefresh: true }));
  } catch (error) {
    yield put(updatePrescriptionFailure(errMsg(error, 'Failed to update prescription.')));
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* prescriptionSaga() {
  yield all([
    takeLatest(fetchPrescriptionsRequest.type,   handleFetchPrescriptions),
    takeLatest(createPrescriptionRequest.type,   handleCreatePrescription),
    takeLatest(updatePrescriptionRequest.type,   handleUpdatePrescription),
  ]);
}
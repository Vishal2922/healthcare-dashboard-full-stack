import {
  call, put, take, takeLatest, takeEvery,
  fork, select, delay, all,
} from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

import {
  fetchAppointmentsAPI,
  bookAppointmentAPI,
  updateAppointmentStatusAPI,
  cancelAppointmentAPI,
} from './appointmentAPI';

import {
  fetchAppointmentsRequest, fetchAppointmentsSuccess, fetchAppointmentsFailure,
  prefetchPageRequest, prefetchPageSuccess, prefetchPageFailure,
  bookAppointmentRequest, bookAppointmentSuccess, bookAppointmentFailure,
  updateStatusRequest, updateStatusSuccess, updateStatusFailure,
  cancelAppointmentRequest, cancelAppointmentSuccess, cancelAppointmentFailure,
  checkSlotConflictRequest, checkSlotConflictSuccess, checkSlotConflictFailure,
  setOnlineStatus, enqueueOfflineAction, setDrainingQueue, dequeueOfflineAction,
  invalidatePageCache,
} from './appointmentSlice';

import pageCache from '../../services/pageCacheManager';

// Inline UUID
const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// ── Selectors ─────────────────────────────────────────────────────────────────
const selectFilters         = (state) => state.appointments.filters;
const selectOfflineQueue    = (state) => state.appointments.offlineQueue;
const selectIsOnline        = (state) => state.appointments.isOnline;
const selectMeta            = (state) => state.appointments.meta;

// Track in-flight prefetch pages to avoid duplicate API calls
const inFlightPrefetch = new Set();
const PREFETCH_DELAY_MS = 300;

// ── 1. Fetch Appointments (Normal & Prefetch) ─────────────────────────────────
function* handleFetchAppointments(action) {
  try {
    const filters = yield select(selectFilters);
    const overrides = action.payload || {};
    const apiParams = { ...filters, ...overrides };
    
    // Extract _prefetch flag
    const isPrefetch = !!apiParams._prefetch;
    delete apiParams._prefetch;

    const cacheKey = pageCache.makeKey('appointments', {
      page: apiParams.page || 1,
      per_page: apiParams.perPage || apiParams.per_page || 5,
      ...filters, 
      ...overrides,
    });

    if (isPrefetch) {
      if (inFlightPrefetch.has(cacheKey)) return;
      inFlightPrefetch.add(cacheKey);

      yield put(prefetchPageRequest());
      const data = yield call(fetchAppointmentsAPI, apiParams);
      
      const normMeta = data.pagination || data.meta || {
        total: data.appointments?.length || 0,
        page: apiParams.page || 1,
        per_page: apiParams.perPage || apiParams.per_page || 5,
        total_pages: 1,
      };

      // Store in global page cache
      pageCache.set(cacheKey, { data: data.appointments || data, meta: normMeta });

      yield put(prefetchPageSuccess({ cacheKey, data: data.appointments || data, meta: normMeta }));
      inFlightPrefetch.delete(cacheKey);
      return;
    }

    // Normal fetch
    const data = yield call(fetchAppointmentsAPI, apiParams);
    
    const normMeta = data.pagination || data.meta || {
      total: data.appointments?.length || 0,
      page: apiParams.page || 1,
      per_page: apiParams.perPage || apiParams.per_page || 5,
      total_pages: 1,
    };

    // Store in global page cache
    pageCache.set(cacheKey, { data: data.appointments || data, meta: normMeta });

    yield put(fetchAppointmentsSuccess({ appointments: data.appointments || data, pagination: normMeta, cacheKey }));

    // Automatically prefetch the NEXT page if not on the last page
    yield fork(prefetchNextPage, apiParams, normMeta);

  } catch (error) {
    if (action.payload?._prefetch) {
      yield put(prefetchPageFailure());
      const cacheKey = pageCache.makeKey('appointments', action.payload);
      inFlightPrefetch.delete(cacheKey);
    } else {
      yield put(fetchAppointmentsFailure(
        error.response?.data?.message || error.message || 'Failed to load appointments.'
      ));
    }
  }
}

// ── 2. Automatic Prefetch Worker ─────────────────────────────────────────────
function* prefetchNextPage(currentParams, currentMeta) {
  yield delay(PREFETCH_DELAY_MS);

  const page = Number(currentMeta.page || 1);
  const totalPages = Number(currentMeta.total_pages || currentMeta.last_page || 1);

  if (page >= totalPages) return; // already on last page

  const nextParams = { ...currentParams, page: page + 1 };
  
  const cacheKey = pageCache.makeKey('appointments', {
    page: nextParams.page,
    per_page: nextParams.perPage || nextParams.per_page || 5,
    ...nextParams
  });

  // Skip if already cached or in-flight
  if (pageCache.has(cacheKey) || inFlightPrefetch.has(cacheKey)) return;

  inFlightPrefetch.add(cacheKey);

  try {
    yield put(prefetchPageRequest());
    const data = yield call(fetchAppointmentsAPI, nextParams);
    
    const normMeta = data.pagination || data.meta || { ...currentMeta, page: nextParams.page };
    const rawAppointments = data.appointments || data;

    pageCache.set(cacheKey, { data: rawAppointments, meta: normMeta });
    yield put(prefetchPageSuccess({ cacheKey, data: rawAppointments, meta: normMeta }));
  } catch (e) {
    yield put(prefetchPageFailure());
  } finally {
    inFlightPrefetch.delete(cacheKey);
  }
}

// ── 3. Book Appointment ───────────────────────────────────────────────────────
function* handleBookAppointment(action) {
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:       uuidv4(),
      type:     'book',
      payload:  action.payload,
      queuedAt: new Date().toISOString(),
    }));
    yield put(bookAppointmentFailure(
      'You are offline. Your booking has been queued and will submit when you reconnect.'
    ));
    return;
  }

  try {
    const appointment = yield call(bookAppointmentAPI, action.payload);
    pageCache.invalidate('appointments');
    yield put(bookAppointmentSuccess(appointment));
    
    // Refresh page 1 after booking
    yield put(fetchAppointmentsRequest({ page: 1 }));
  } catch (error) {
    yield put(bookAppointmentFailure(
      error.response?.data?.message || error.response?.data?.error || 'Booking failed. Please try again.'
    ));
  }
}

// ── 4. Update Status (per-row, concurrent) ────────────────────────────────────
function* handleUpdateStatus(action) {
  const { id, status } = action.payload;
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:       uuidv4(),
      type:     'updateStatus',
      payload:  { id, status },
      queuedAt: new Date().toISOString(),
    }));
    yield put(updateStatusFailure({
      id,
      message: 'You are offline. This status change will sync when you reconnect.',
    }));
    return;
  }

  try {
    const updated = yield call(updateAppointmentStatusAPI, id, status);
    pageCache.invalidate('appointments');
    yield put(updateStatusSuccess(updated));
  } catch (error) {
    yield put(updateStatusFailure({
      id,
      message: error.response?.data?.message || error.message || 'Failed to update status.',
    }));
  }
}

// ── 5. Cancel Appointment ─────────────────────────────────────────────────────
function* handleCancelAppointment(action) {
  const { id } = action.payload;
  const isOnline = yield select(selectIsOnline);

  if (!isOnline) {
    yield put(enqueueOfflineAction({
      id:       uuidv4(),
      type:     'cancel',
      payload:  { id },
      queuedAt: new Date().toISOString(),
    }));
    yield put(cancelAppointmentFailure({
      id,
      message: 'You are offline. Cancellation will submit when you reconnect.',
    }));
    return;
  }

  try {
    yield call(cancelAppointmentAPI, id);
    pageCache.invalidate('appointments');
    yield put(cancelAppointmentSuccess({ id }));
  } catch (error) {
    yield put(cancelAppointmentFailure({
      id,
      message: error.response?.data?.message || error.message || 'Failed to cancel.',
    }));
  }
}

// ── 6. Slot Conflict Check (debounced via takeLatest) ─────────────────────────
function* handleCheckSlotConflict(action) {
  yield delay(500); // debounce — takeLatest cancels stale checks automatically

  const { doctor_id, appointment_time } = action.payload;
  if (!doctor_id || !appointment_time) {
    yield put(checkSlotConflictFailure());
    return;
  }

  try {
    const data = yield call(fetchAppointmentsAPI, { page: 1, perPage: 50, status: 'scheduled' });
    const rawAppointments = data.appointments || data;

    const requestedTime = new Date(appointment_time).getTime();
    const SLOT_MS = 30 * 60 * 1000; // 30-minute window

    const hasConflict = rawAppointments.some((appt) => {
      if (String(appt.doctor_id) !== String(doctor_id)) return false;
      return Math.abs(new Date(appt.appointment_time).getTime() - requestedTime) < SLOT_MS;
    });

    yield put(checkSlotConflictSuccess({ isAvailable: !hasConflict, checkedSlot: appointment_time }));
  } catch (_) {
    yield put(checkSlotConflictFailure());
  }
}

// ── 7. Offline Queue Drain ────────────────────────────────────────────────────
function* drainOfflineQueue() {
  const queue = yield select(selectOfflineQueue);
  if (queue.length === 0) return;

  yield put(setDrainingQueue(true));

  for (const item of queue) {
    try {
      switch (item.type) {
        case 'book': {
          const appt = yield call(bookAppointmentAPI, item.payload);
          yield put(bookAppointmentSuccess(appt));
          break;
        }
        case 'updateStatus': {
          const { id, status } = item.payload;
          const updated = yield call(updateAppointmentStatusAPI, id, status);
          yield put(updateStatusSuccess(updated));
          break;
        }
        case 'cancel': {
          yield call(cancelAppointmentAPI, item.payload.id);
          yield put(cancelAppointmentSuccess({ id: item.payload.id }));
          break;
        }
        default:
          break;
      }
      yield put(dequeueOfflineAction(item.id));
    } catch (error) {
      console.error(`[appointmentSaga] Queue item failed (${item.type}):`, error.message);
      yield put(dequeueOfflineAction(item.id));
    }
  }

  yield put(setDrainingQueue(false));
  pageCache.invalidate('appointments');
  yield put(invalidatePageCache());
  
  const currentMeta = yield select(selectMeta);
  yield put(fetchAppointmentsRequest({ page: currentMeta.page || 1 }));
}

// ── 8. Network Status Watcher ─────────────────────────────────────────────────
function createNetworkChannel() {
  return eventChannel((emit) => {
    const online  = () => emit({ type: 'ONLINE' });
    const offline = () => emit({ type: 'OFFLINE' });
    window.addEventListener('online',  online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online',  online);
      window.removeEventListener('offline', offline);
    };
  });
}

function* watchNetworkStatus() {
  const channel = yield call(createNetworkChannel);
  try {
    while (true) {
      const event = yield take(channel);
      if (event.type === 'ONLINE') {
        yield put(setOnlineStatus(true));
        yield delay(1000); // wait for connection to stabilise
        yield fork(drainOfflineQueue);
      } else {
        yield put(setOnlineStatus(false));
      }
    }
  } finally {
    channel.close();
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function* appointmentSaga() {
  yield all([
    takeLatest(fetchAppointmentsRequest.type,  handleFetchAppointments),
    takeLatest(bookAppointmentRequest.type,    handleBookAppointment),
    takeEvery(updateStatusRequest.type,        handleUpdateStatus),
    takeEvery(cancelAppointmentRequest.type,   handleCancelAppointment),
    takeLatest(checkSlotConflictRequest.type,  handleCheckSlotConflict),
    fork(watchNetworkStatus),
  ]);
}
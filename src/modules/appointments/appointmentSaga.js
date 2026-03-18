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
  prefetchPageRequest, prefetchPageSuccess,
  bookAppointmentRequest, bookAppointmentSuccess, bookAppointmentFailure,
  updateStatusRequest, updateStatusSuccess, updateStatusFailure,
  cancelAppointmentRequest, cancelAppointmentSuccess, cancelAppointmentFailure,
  checkSlotConflictRequest, checkSlotConflictSuccess, checkSlotConflictFailure,
  setOnlineStatus, enqueueOfflineAction, setDrainingQueue, dequeueOfflineAction,
  invalidatePrefetchCache,
} from './appointmentSlice';

// Inline UUID — no external dependency needed
const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// ── Selectors ─────────────────────────────────────────────────────────────────
const selectFilters         = (state) => state.appointments.filters;
const selectPrefetchedPages = (state) => state.appointments.prefetchedPages;
const selectOfflineQueue    = (state) => state.appointments.offlineQueue;
const selectIsOnline        = (state) => state.appointments.isOnline;

// ── 1. Fetch Appointments ─────────────────────────────────────────────────────
function* handleFetchAppointments() {
  try {
    const filters = yield select(selectFilters);
    const data = yield call(fetchAppointmentsAPI, {
      page:    filters.page,
      perPage: filters.perPage,
      status:  filters.status || undefined,
    });
    yield put(fetchAppointmentsSuccess(data));

    // Auto-prefetch next page
    const { total_pages, page } = data.pagination;
    if (page < total_pages) {
      yield fork(handlePrefetchPage, page + 1);
    }
  } catch (error) {
    yield put(fetchAppointmentsFailure(
      error.response?.data?.message || error.message || 'Failed to load appointments.'
    ));
  }
}

// ── 2. Prefetch (background, silent) ─────────────────────────────────────────
function* handlePrefetchPage(targetPage) {
  try {
    const cached = yield select(selectPrefetchedPages);
    if (cached[targetPage]) return;

    const filters = yield select(selectFilters);
    yield put(prefetchPageRequest({ page: targetPage }));

    const data = yield call(fetchAppointmentsAPI, {
      page:    targetPage,
      perPage: filters.perPage,
      status:  filters.status || undefined,
    });

    yield put(prefetchPageSuccess({ page: targetPage, appointments: data.appointments }));
  } catch (_) {
    // Silent — user gets a real fetch on navigation if cache is missing
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
    yield put(bookAppointmentSuccess(appointment));
    yield put(invalidatePrefetchCache());
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

    const requestedTime = new Date(appointment_time).getTime();
    const SLOT_MS = 30 * 60 * 1000; // 30-minute window

    const hasConflict = data.appointments.some((appt) => {
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
  yield put(invalidatePrefetchCache());
  yield put(fetchAppointmentsRequest({ page: 1 }));
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
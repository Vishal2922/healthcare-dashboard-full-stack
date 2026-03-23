import {
  all,
  call,
  put,
  fork,
  delay,
  takeLatest,
  takeEvery,
} from 'redux-saga/effects';

import {
  fetchNotificationsAPI,
  markAsReadAPI,
  markAllAsReadAPI,
  deleteNotificationAPI,
  fetchUnreadCountAPI,
} from './notificationAPI';

import {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  markAsReadRequest,
  markAsReadSuccess,
  markAsReadFailure,
  markAllAsReadRequest,
  markAllAsReadSuccess,
  markAllAsReadFailure,
  deleteNotificationRequest,
  deleteNotificationSuccess,
  deleteNotificationFailure,
  setUnreadCount,
} from './notificationSlice';

// Poll for unread badge every 60 seconds (configurable)
const UNREAD_POLL_INTERVAL = 60 * 1000;

// ─── Helper ──────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// ════════════════════════════════════════════════════════════════════════════
// 1. FETCH NOTIFICATIONS
//    GET /api/notifications?page=1&per_page=20
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchNotifications(action) {
  try {
    const params   = action.payload ?? {};
    const response = yield call(fetchNotificationsAPI, params);

    // Backend: { status, data: { notifications, unread_count, pagination } }
    const data = response?.data ?? response;
    yield put(
      fetchNotificationsSuccess({
        notifications: data.notifications ?? [],
        unread_count:  data.unread_count  ?? 0,
        pagination:    data.pagination    ?? {
          total:       0,
          page:        params.page     ?? 1,
          per_page:    params.per_page ?? 20,
          total_pages: 0,
        },
      })
    );
  } catch (error) {
    yield put(fetchNotificationsFailure(errMsg(error, 'Failed to load notifications.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. MARK SINGLE AS READ
//    PATCH /api/notifications/{id}/read
//    Uses takeEvery so multiple items can be marked concurrently.
// ════════════════════════════════════════════════════════════════════════════
function* handleMarkAsRead(action) {
  const id = action.payload;
  try {
    yield call(markAsReadAPI, id);
    yield put(markAsReadSuccess(id));
  } catch (error) {
    yield put(
      markAsReadFailure({
        id,
        message: errMsg(error, 'Failed to mark notification as read.'),
      })
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. MARK ALL AS READ
//    POST /api/notifications/mark-all-read
// ════════════════════════════════════════════════════════════════════════════
function* handleMarkAllAsRead() {
  try {
    yield call(markAllAsReadAPI);
    yield put(markAllAsReadSuccess());
  } catch (error) {
    yield put(markAllAsReadFailure(errMsg(error, 'Failed to mark all as read.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. DELETE NOTIFICATION
//    DELETE /api/notifications/{id}
//    Uses takeEvery so multiple deletes don't cancel each other.
// ════════════════════════════════════════════════════════════════════════════
function* handleDeleteNotification(action) {
  const id = action.payload;
  try {
    yield call(deleteNotificationAPI, id);
    yield put(deleteNotificationSuccess(id));
  } catch (error) {
    yield put(
      deleteNotificationFailure({
        id,
        message: errMsg(error, 'Failed to delete notification.'),
      })
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 5. UNREAD COUNT POLLER (background fork)
//    Silently polls GET /api/notifications/unread-count every 60 s.
//    Updates the badge in the Header without re-fetching the full list.
//    Will silently skip failed polls (network errors, 401 while refreshing).
// ════════════════════════════════════════════════════════════════════════════
function* watchUnreadCount() {
  // Initial wait — let the app settle before first poll
  yield delay(5000);

  while (true) {
    try {
      const response = yield call(fetchUnreadCountAPI);
      const data     = response?.data ?? response;
      const count    = data?.unread_count ?? 0;
      yield put(setUnreadCount(count));
    } catch (_) {
      // Silent — badge will update on next successful poll
    }

    yield delay(UNREAD_POLL_INTERVAL);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT NOTIFICATION SAGA
// ════════════════════════════════════════════════════════════════════════════
export default function* notificationSaga() {
  yield all([
    takeLatest(fetchNotificationsRequest.type, handleFetchNotifications),
    takeEvery(markAsReadRequest.type,           handleMarkAsRead),
    takeLatest(markAllAsReadRequest.type,       handleMarkAllAsRead),
    takeEvery(deleteNotificationRequest.type,   handleDeleteNotification),
    // Background unread badge poller — never cancels
    fork(watchUnreadCount),
  ]);
}
import { createSlice } from '@reduxjs/toolkit';

/**
 * notificationSlice — Module 13: Notification System
 *
 * State shape:
 *   notifications      → full notification list (all fetched)
 *   unreadCount        → total unread badge count
 *   pagination         → { total, page, per_page, total_pages }
 *
 *   loading            → skeleton while fetching list
 *   markLoading        → { [notificationId]: true } per-item loading
 *   markAllLoading     → true while marking all as read
 *   deleteLoading      → { [notificationId]: true } per-item delete loading
 *
 *   error              → last error string
 *   successMessage     → shown in toast after action
 *
 * Notification types handled:
 *   appointment_alert  → new / changed appointment
 *   payment_alert      → invoice paid / overdue
 *   system             → system-wide announcements
 */

const initialState = {
  notifications: [],
  unreadCount:   0,
  pagination: {
    total:       0,
    page:        1,
    per_page:    20,
    total_pages: 0,
  },

  loading:       false,
  markLoading:   {},   // { [id]: true }
  markAllLoading: false,
  deleteLoading: {},   // { [id]: true }

  error:          null,
  successMessage: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,

  reducers: {

    // ── Fetch All Notifications ──────────────────────────────────────────────
    fetchNotificationsRequest: (state) => {
      state.loading = true;
      state.error   = null;
    },
    fetchNotificationsSuccess: (state, action) => {
      state.notifications = action.payload.notifications;
      state.unreadCount   = action.payload.unread_count ?? 0;
      state.pagination    = action.payload.pagination ?? state.pagination;
      state.loading       = false;
    },
    fetchNotificationsFailure: (state, action) => {
      state.loading = false;
      state.error   = action.payload;
    },

    // ── Mark Single Notification as Read ────────────────────────────────────
    markAsReadRequest: (state, action) => {
      state.markLoading[action.payload] = true;
      state.error                       = null;
    },
    markAsReadSuccess: (state, action) => {
      const id = action.payload;
      delete state.markLoading[id];

      const notification = state.notifications.find((n) => n.id === id);
      if (notification && !notification.is_read) {
        notification.is_read  = true;
        notification.read_at  = new Date().toISOString();
        state.unreadCount     = Math.max(0, state.unreadCount - 1);
      }
    },
    markAsReadFailure: (state, action) => {
      const { id, message } = action.payload;
      delete state.markLoading[id];
      state.error = message;
    },

    // ── Mark All as Read ─────────────────────────────────────────────────────
    markAllAsReadRequest: (state) => {
      state.markAllLoading = true;
      state.error          = null;
      state.successMessage = null;
    },
    markAllAsReadSuccess: (state) => {
      state.markAllLoading = false;
      state.successMessage = 'All notifications marked as read.';
      state.unreadCount    = 0;
      state.notifications  = state.notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at ?? new Date().toISOString(),
      }));
    },
    markAllAsReadFailure: (state, action) => {
      state.markAllLoading = false;
      state.error          = action.payload;
    },

    // ── Delete Single Notification ───────────────────────────────────────────
    deleteNotificationRequest: (state, action) => {
      state.deleteLoading[action.payload] = true;
      state.error                         = null;
    },
    deleteNotificationSuccess: (state, action) => {
      const id = action.payload;
      delete state.deleteLoading[id];
      const wasUnread = state.notifications.find((n) => n.id === id && !n.is_read);
      state.notifications  = state.notifications.filter((n) => n.id !== id);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    deleteNotificationFailure: (state, action) => {
      const { id, message } = action.payload;
      delete state.deleteLoading[id];
      state.error = message;
    },

    // ── Local-only: add a notification pushed via WebSocket/polling ─────────
    addNotification: (state, action) => {
      // Prepend so newest is first
      state.notifications.unshift(action.payload);
      state.pagination.total += 1;
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },

    // ── Broadcast Single Notification ──────────────────────────────────────────
    broadcastRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    },
    broadcastSuccess: (state, action) => {
      state.loading = false;
      state.successMessage = 'Broadcast sent successfully.';
    },
    broadcastFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ── Set unread badge count independently (e.g. from header poll) ────────
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    // ── UI Helpers ───────────────────────────────────────────────────────────
    clearSuccess: (state) => { state.successMessage = null; },
    clearError:   (state) => { state.error = null; },
    resetNotifications: () => initialState,
  },
});

export const {
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
  addNotification,
  setUnreadCount,
  broadcastRequest,
  broadcastSuccess,
  broadcastFailure,
  clearSuccess,
  clearError,
  resetNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
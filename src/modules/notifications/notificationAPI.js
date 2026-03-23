import axiosClient from '../../services/axiosClient';

/**
 * notificationAPI — Module 13: Notification System
 *
 * Thin API layer. Only this file talks to axiosClient.
 * Saga calls these functions via `yield call(...)`.
 *
 * NOTE: The backend `clinic_backend` does not yet expose dedicated
 * /api/notifications endpoints. These functions map to the endpoints
 * defined in the MVP architecture. Once the backend routes are added,
 * this layer works without changes to the saga or hook.
 *
 * Expected backend routes (all roles, tenant-scoped):
 *   GET    /api/notifications          → list + unread count
 *   PATCH  /api/notifications/{id}/read → mark single as read
 *   POST   /api/notifications/mark-all-read → mark all as read
 *   DELETE /api/notifications/{id}     → delete single
 *   GET    /api/notifications/unread-count → badge-only poll
 */

// ─── Fetch Notifications ─────────────────────────────────────────────────────
export const fetchNotificationsAPI = async ({ page = 1, per_page = 20 } = {}) => {
  const response = await axiosClient.get('/api/notifications', {
    params: { page, per_page },
  });
  return response.data;
  // shape: { status, data: { notifications: [...], unread_count: N, pagination: {...} } }
};

// ─── Mark Single as Read ─────────────────────────────────────────────────────
export const markAsReadAPI = async (notificationId) => {
  const response = await axiosClient.patch(
    `/api/notifications/${notificationId}/read`
  );
  return response.data;
  // shape: { status, message }
};

// ─── Mark All as Read ────────────────────────────────────────────────────────
export const markAllAsReadAPI = async () => {
  const response = await axiosClient.post('/api/notifications/mark-all-read');
  return response.data;
  // shape: { status, message }
};

// ─── Delete Notification ─────────────────────────────────────────────────────
export const deleteNotificationAPI = async (notificationId) => {
  const response = await axiosClient.delete(`/api/notifications/${notificationId}`);
  return response.data;
  // shape: { status, message }
};

// ─── Unread Count Only (for badge polling) ───────────────────────────────────
export const fetchUnreadCountAPI = async () => {
  const response = await axiosClient.get('/api/notifications/unread-count');
  return response.data;
  // shape: { status, data: { unread_count: N } }
};
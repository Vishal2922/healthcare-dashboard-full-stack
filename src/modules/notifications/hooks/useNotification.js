import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useRef } from 'react';

import {
  fetchNotificationsRequest,
  markAsReadRequest,
  markAllAsReadRequest,
  deleteNotificationRequest,
  clearSuccess,
  clearError,
  resetNotifications,
} from '../notificationSlice';

/**
 * useNotification() — Module 13
 *
 * Available to ALL authenticated roles.
 *
 * Usage:
 *   const notifs = useNotification();
 *   notifs.loadNotifications();
 *   notifs.markRead(id);
 *   notifs.markAllRead();
 *   notifs.deleteNotification(id);
 *
 * Auto-loads ONCE on first mount. Ref-guarded to prevent repeat fetches.
 * All hooks called unconditionally (Rules of Hooks).
 */
export default function useNotification() {
  const dispatch = useDispatch();
  const hasFetched = useRef(false);

  // ── All selectors unconditional ──────────────────────────────────────────
  const notifications = useSelector((s) => s.notifications.notifications);
  const unreadCount   = useSelector((s) => s.notifications.unreadCount);
  const pagination    = useSelector((s) => s.notifications.pagination);
  const loading       = useSelector((s) => s.notifications.loading);
  const markLoading   = useSelector((s) => s.notifications.markLoading);
  const markAllLoading= useSelector((s) => s.notifications.markAllLoading);
  const deleteLoading = useSelector((s) => s.notifications.deleteLoading);
  const error         = useSelector((s) => s.notifications.error);
  const successMsg    = useSelector((s) => s.notifications.successMessage);

  // ── Auto-load ONCE on mount (ref-guarded) ─────────────────────────────────
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchNotificationsRequest({ page: 1, per_page: 20 }));
    }
  }, [dispatch]);

  // ── All useCallbacks unconditional ───────────────────────────────────────
  const loadNotifications = useCallback(
    ({ page = 1, per_page = 20 } = {}) =>
      dispatch(fetchNotificationsRequest({ page, per_page })),
    [dispatch]
  );

  const markRead = useCallback(
    (id) => dispatch(markAsReadRequest(id)),
    [dispatch]
  );

  const markAllRead = useCallback(
    () => dispatch(markAllAsReadRequest()),
    [dispatch]
  );

  const deleteNotification = useCallback(
    (id) => dispatch(deleteNotificationRequest(id)),
    [dispatch]
  );

  const dismissSuccess  = useCallback(() => dispatch(clearSuccess()), [dispatch]);
  const dismissError    = useCallback(() => dispatch(clearError()),   [dispatch]);
  const resetState      = useCallback(() => dispatch(resetNotifications()), [dispatch]);

  // Derived helpers
  const isMarking       = useCallback((id) => !!markLoading[id],   [markLoading]);
  const isDeleting      = useCallback((id) => !!deleteLoading[id], [deleteLoading]);

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications   = notifications.filter((n) =>  n.is_read);

  return {
    // State
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    pagination,
    loading,
    markLoading,
    markAllLoading,
    deleteLoading,
    error,
    successMessage: successMsg,
    // Actions
    loadNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    dismissSuccess,
    dismissError,
    resetState,
    // Derived
    isMarking,
    isDeleting,
    hasUnread: unreadCount > 0,
    totalCount: notifications.length,
  };
}
import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { loginRequest, logoutRequest, clearError } from '../authSlice';

/**
 * useAuth()
 *
 * Provides components with:
 *   - Current auth state (user, isLoggedIn, loading, error)
 *   - login(username, password) action dispatcher
 *   - logout() action dispatcher
 *
 * Components never import slice actions directly — they go through this hook.
 *
 * Usage:
 *   const { user, isLoggedIn, login, logout, loading, error } = useAuth();
 */
export default function useAuth() {
  const dispatch = useDispatch();

  const { user, isLoggedIn, loading, error, initialized, csrfToken } =
    useSelector((state) => state.auth);

  const login = useCallback(
    (username, password) => {
      dispatch(loginRequest({ username, password }));
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutRequest());
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isLoggedIn,
    loading,
    error,
    initialized,
    csrfToken,
    login,
    logout,
    dismissError,
  };
}
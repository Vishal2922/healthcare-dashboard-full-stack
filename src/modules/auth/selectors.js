/**
 * Auth Selectors
 *
 * Use these in components via useSelector() to avoid coupling to state shape.
 *
 * Usage:
 *   const user        = useSelector(selectUser);
 *   const isLoggedIn  = useSelector(selectIsLoggedIn);
 */

export const selectAuth          = (state) => state.auth;
export const selectUser          = (state) => state.auth.user;
export const selectIsLoggedIn    = (state) => state.auth.isLoggedIn;
export const selectAuthLoading   = (state) => state.auth.loading;
export const selectAuthError     = (state) => state.auth.error;
export const selectAuthInitialized = (state) => state.auth.initialized;
export const selectCsrfToken     = (state) => state.auth.csrfToken;

/** Role helpers */
export const selectUserRole        = (state) => state.auth.user?.role ?? null;
export const selectUserPermissions = (state) => state.auth.user?.permissions ?? [];

export const selectHasPermission = (permissionKey) => (state) =>
  state.auth.user?.permissions?.includes(permissionKey) ?? false;

export const selectIsAdmin  = (state) => state.auth.user?.role === 'Admin';
export const selectIsDoctor = (state) =>
  ['Provider', 'Doctor'].includes(state.auth.user?.role);
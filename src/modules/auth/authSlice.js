import { createSlice } from '@reduxjs/toolkit';

/**
 * authSlice
 *
 * Manages authentication state for the entire app.
 *
 * State shape:
 *   user         → decoded user object from backend
 *                  { id, username, email, full_name, role, permissions, tenant_id }
 *   accessToken  → JWT access token (also in localStorage for refresh flow)
 *   csrfToken    → CSRF token stored in sessionStorage and Redux
 *   isLoggedIn   → boolean
 *   loading      → for login spinner
 *   error        → login error message
 *   initialized  → has the app checked for an existing session on load?
 */

const initialState = {
  user: null,
  accessToken: null,
  csrfToken: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Triggered by component → picked up by authSaga
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      const { access_token, csrf_token, user } = action.payload;
      state.user = user;
      state.accessToken = access_token;
      state.csrfToken = csrf_token;
      state.isLoggedIn = true;
      state.loading = false;
      state.error = null;
    },

    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isLoggedIn = false;
    },

    logoutRequest: (state) => {
      state.loading = true;
    },

    logoutSuccess: (state) => {
      state.user = null;
      state.accessToken = null;
      state.csrfToken = null;
      state.isLoggedIn = false;
      state.loading = false;
      state.error = null;
    },

    // Called after successful token refresh
    tokenRefreshed: (state, action) => {
      const { access_token, csrf_token } = action.payload;
      state.accessToken = access_token;
      if (csrf_token) state.csrfToken = csrf_token;
    },

    // App startup: check if a valid session exists (via refresh cookie)
    sessionCheckComplete: (state) => {
      state.initialized = true;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  tokenRefreshed,
  sessionCheckComplete,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
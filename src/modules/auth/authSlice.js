import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user:        null,
  accessToken: null,
  csrfToken:   null,
  isLoggedIn:  false,
  loading:     false,
  error:       null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    loginRequest: (state) => {
      state.loading = true;
      state.error   = null;
    },

    loginSuccess: (state, action) => {
      const { access_token, csrf_token, user } = action.payload;
      state.user        = user;
      state.accessToken = access_token;
      state.csrfToken   = csrf_token;
      state.isLoggedIn  = true;
      state.loading     = false;
      state.error       = null;
      // ── FIX: mark initialized immediately on login so AppRouter
      //    never falls back to <PageLoader /> after the navigate
      state.initialized = true;
    },

    loginFailure: (state, action) => {
      state.loading    = false;
      state.error      = action.payload;
      state.isLoggedIn = false;
    },

    logoutRequest: (state) => {
      state.loading = true;
    },

    logoutSuccess: (state) => {
      state.user        = null;
      state.accessToken = null;
      state.csrfToken   = null;
      state.isLoggedIn  = false;
      state.loading     = false;
      state.error       = null;
    },

    // ── FIX: tokenRefreshed MUST set isLoggedIn + user
    //    otherwise a page-refresh with a valid cookie never restores the session
    tokenRefreshed: (state, action) => {
      const { access_token, csrf_token, user } = action.payload;
      state.accessToken = access_token;
      if (csrf_token) state.csrfToken = csrf_token;
      if (user)       state.user      = user;
      // A successful token refresh means the session is valid
      state.isLoggedIn = true;
    },

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
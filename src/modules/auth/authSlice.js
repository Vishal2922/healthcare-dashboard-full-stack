import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user:           null,
  accessToken:    null,
  csrfToken:      null,
  tokenExpiresIn: null,
  isLoggedIn:     false,
  loading:        false,
  error:          null,
  initialized:    false,
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
      const { access_token, csrf_token, user, expires_in } = action.payload;
      state.user           = user;
      state.accessToken    = access_token;
      state.csrfToken      = csrf_token;
      state.tokenExpiresIn = expires_in ?? null;
      state.isLoggedIn     = true;
      state.loading        = false;
      state.error          = null;
      state.initialized    = true;
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
      state.user           = null;
      state.accessToken    = null;
      state.csrfToken      = null;
      state.tokenExpiresIn = null;
      state.isLoggedIn     = false;
      state.loading        = false;
      state.error          = null;
    },

    tokenRefreshed: (state, action) => {
      const { access_token, csrf_token, expires_in } = action.payload;
      state.accessToken    = access_token;
      if (csrf_token)  state.csrfToken      = csrf_token;
      if (expires_in)  state.tokenExpiresIn = expires_in;
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
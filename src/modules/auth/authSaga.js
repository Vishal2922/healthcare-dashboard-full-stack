import { call, put, takeLatest } from 'redux-saga/effects';
// Using named imports matching your authAPI.js exports
import { loginAPI, logoutAPI, refreshTokenAPI } from './authAPI'; 
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  tokenRefreshed,
  sessionCheckComplete,
} from './authSlice';

// ─── Login ────────────────────────────────────────────────────────────────────
function* handleLogin(action) {
  try {
    const { username, password } = action.payload;
    // call the named function directly
    const response = yield call(loginAPI, { username, password });

    // loginAPI already returns response.data (axios-unwrapped).
    // Backend shape: { status, message, data: { access_token, csrf_token, user } }
    const payloadData = response?.data || response;
    const { access_token, csrf_token, user } = payloadData;

    // Persist access token (needed by axiosClient refresh flow)
    if (access_token) localStorage.setItem('access_token', access_token);

    // Persist CSRF token in sessionStorage
    if (csrf_token) sessionStorage.setItem('csrf_token', csrf_token);

    yield put(loginSuccess({ access_token, csrf_token, user }));
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Login failed. Please check your credentials.';
    yield put(loginFailure(message));
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function* handleLogout() {
  try {
    // call the named function directly
    yield call(logoutAPI);
  } catch (error) {
    // Best-effort logout — clear client state regardless of server response
    console.warn("Server logout failed, clearing local session anyway.", error.message);
  } finally {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
    yield put(logoutSuccess());
  }
}

// ─── Session Check (on app mount) ─────────────────────────────────────────────
function* handleSessionCheck() {
  try {
    // 1. SHORT-CIRCUIT: If we don't have an access token, don't ask the backend.
    // This prevents the automatic 401 console error when the app first loads.
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      yield put(logoutSuccess());
      yield put(sessionCheckComplete());
      return;
    }

    // 2. We have a token, attempt to refresh it silently
    const response = yield call(refreshTokenAPI);

    // refreshTokenAPI returns response.data (axios-unwrapped).
    // Backend shape: { status, message, data: { access_token, csrf_token } }
    const payloadData = response?.data || response;
    const { access_token, csrf_token, user } = payloadData;

    if (access_token) localStorage.setItem('access_token', access_token);
    if (csrf_token) sessionStorage.setItem('csrf_token', csrf_token);

    yield put(tokenRefreshed({ access_token, csrf_token, user }));
  } catch (error) {
    // Gracefully handle the expected 401 when the refresh token has expired
    if (error.response && error.response.status === 401) {
      // Clear any stale data just to be safe
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('csrf_token');
      // Dispatch logout success to put the Redux state in a clean logged-out status
      yield put(logoutSuccess());
    } else {
      console.error("Session check failed with an unexpected error:", error);
    }
  } finally {
    yield put(sessionCheckComplete());
  }
}

// ─── Root Auth Saga ───────────────────────────────────────────────────────────
export default function* authSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(logoutRequest.type, handleLogout);
  yield takeLatest('auth/sessionCheck', handleSessionCheck);
}
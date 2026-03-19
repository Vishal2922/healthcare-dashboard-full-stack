import {
  call,
  put,
  takeLatest,
  all,
} from 'redux-saga/effects';

import { loginAPI, logoutAPI, refreshTokenDirectAPI } from './authAPI';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  tokenRefreshed,
  sessionCheckComplete,
} from './authSlice';

import { getIsRefreshing, setIsRefreshing } from '../../services/storeInjector';



/**
 * Decode the JWT payload to extract user info (username, role_name, permissions).
 * This avoids an extra /api/auth/me call during session restoration.
 */
function decodeUserFromJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      id:          payload.sub,
      username:    payload.username,
      role:        payload.role_name,
      role_id:     payload.role_id,
      tenant_id:   payload.tenant_id,
      permissions: payload.permissions || [],
    };
  } catch (e) {
    console.warn('[authSaga] Failed to decode JWT:', e.message);
    return null;
  }
}



function* performSilentRefresh() {
  if (getIsRefreshing()) {
    console.info('[authSaga] Skipping proactive refresh — interceptor already refreshing');
    return { success: true };
  }

  try {
    const response = yield call(refreshTokenDirectAPI);
    const data = response?.data || response;
    const { access_token, csrf_token, expires_in } = data;

    if (!access_token) {
      console.warn('[authSaga] Silent refresh returned no access_token');
      return { success: false, isAuthError: false };
    }

    localStorage.setItem('access_token', access_token);
    if (csrf_token) sessionStorage.setItem('csrf_token', csrf_token);

    yield put(tokenRefreshed({ access_token, csrf_token, expires_in }));

    return { success: true, expiresIn: expires_in };

  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) {
      console.info('[authSaga] Silent refresh 401 — session expired');
      return { success: false, isAuthError: true };
    }

    console.warn('[authSaga] Silent refresh non-auth error:', error.message);
    return { success: false, isAuthError: false };
  }
}


function* handleLogin(action) {
  try {
    const { username, password } = action.payload;
    const response = yield call(loginAPI, { username, password });

    const data = response?.data || response;
    const { access_token, csrf_token, expires_in, user } = data;

    if (access_token) localStorage.setItem('access_token', access_token);
    if (csrf_token)   sessionStorage.setItem('csrf_token', csrf_token);

    yield put(loginSuccess({ access_token, csrf_token, expires_in, user }));

  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error   ||
      'Login failed. Please check your credentials.';
    yield put(loginFailure(message));
  }
}

function* handleLogout() {
  try {
    yield call(logoutAPI);
  } catch (error) {
    console.warn('[authSaga] Server logout failed — clearing local session:', error.message);
  } finally {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
    setIsRefreshing(false);
    yield put(logoutSuccess());
  }
}

function* handleSessionCheck() {
  try {
    const storedToken = localStorage.getItem('access_token');

    if (!storedToken) {
      yield put(logoutSuccess());
      return;
    }

    console.info('[authSaga] Session check: trying silent refresh...');
    const result = yield call(performSilentRefresh);

    if (result.success) {
      console.info('[authSaga] Session check: session restored');

      // Decode user info from the refreshed JWT so the UI has
      // the username, role, and permissions (without an extra /me call).
      const freshToken = localStorage.getItem('access_token');
      const user = decodeUserFromJwt(freshToken);

      if (user) {
        // Use loginSuccess so that state.user is populated —
        // tokenRefreshed alone leaves user as null, which breaks
        // the Header, RoleBasedRoute, and any useAuth() consumers.
        yield put(loginSuccess({
          access_token: freshToken,
          csrf_token:   sessionStorage.getItem('csrf_token'),
          expires_in:   result.expiresIn ?? 10,
          user,
        }));
      }

    } else if (result.isAuthError) {
      console.info('[authSaga] Session check: refresh token expired');
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('csrf_token');
      yield put(logoutSuccess());

    } else {
      console.warn('[authSaga] Session check: network error — treating as logged out');
      localStorage.removeItem('access_token');
      yield put(logoutSuccess());
    }

  } catch (unexpected) {
    console.error('[authSaga] Session check unexpected error:', unexpected);
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
    setIsRefreshing(false);
    yield put(logoutSuccess());

  } finally {
    yield put(sessionCheckComplete());
  }
}

export default function* authSaga() {
  yield all([
    takeLatest(loginRequest.type,   handleLogin),
    takeLatest(logoutRequest.type,  handleLogout),
    takeLatest('auth/sessionCheck', handleSessionCheck),
  ]);
}
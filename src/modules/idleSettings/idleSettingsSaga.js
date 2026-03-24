import { takeLatest, put } from 'redux-saga/effects';
import {
  updateIdleTimeoutRequest,
  updateIdleTimeoutSuccess,
  updateIdleTimeoutFailure,
} from './idleSettingsSlice';

/**
 * idleSettingsSaga
 *
 * Handles admin saving the idle timeout value.
 * Persists to localStorage so the setting survives page refresh.
 *
 * NOTE: The LOGOUT itself is handled by authSaga (POST /api/auth/logout).
 *       This saga only saves the timeout setting.
 *       When idle time expires → useIdleLogout dispatches logoutRequest()
 *       → authSaga picks it up → calls /api/auth/logout backend endpoint.
 */

const STORAGE_KEY = 'idle_timeout_minutes';

function* handleUpdateIdleTimeout(action) {
  try {
    const minutes = Number(action.payload);

    if (!minutes || minutes < 1 || minutes > 480) {
      yield put(updateIdleTimeoutFailure('Timeout must be between 1 and 480 minutes.'));
      return;
    }

    localStorage.setItem(STORAGE_KEY, String(minutes));

    // Small delay for visible spinner feedback
    yield new Promise((resolve) => setTimeout(resolve, 300));

    yield put(updateIdleTimeoutSuccess(minutes));
  } catch (error) {
    yield put(updateIdleTimeoutFailure(
      error?.message || 'Failed to save idle timeout setting.'
    ));
  }
}

export default function* idleSettingsSaga() {
  yield takeLatest(updateIdleTimeoutRequest.type, handleUpdateIdleTimeout);
}
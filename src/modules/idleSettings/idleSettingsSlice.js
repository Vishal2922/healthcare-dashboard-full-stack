import { createSlice } from '@reduxjs/toolkit';

/**
 * idleSettingsSlice
 *
 * Stores the admin-configurable idle logout timeout.
 *
 * Default : 5 minutes
 * Range   : 1 – 480 minutes
 * Persist : localStorage (survives page refresh)
 *
 * On idle → useIdleLogout dispatches logoutRequest()
 *         → authSaga hits POST /api/auth/logout  (backend)
 *         → tokens cleared, redirect to /login
 */

const STORAGE_KEY      = 'idle_timeout_minutes';
const DEFAULT_TIMEOUT  = 55; // 5 minutes default

function loadFromStorage() {
  try {
    const raw    = localStorage.getItem(STORAGE_KEY);
    const parsed = parseInt(raw, 10);
    return !isNaN(parsed) && parsed >= 1 && parsed <= 480
      ? parsed
      : DEFAULT_TIMEOUT;
  } catch {
    return DEFAULT_TIMEOUT;
  }
}

const initialState = {
  timeoutMinutes: loadFromStorage(),
  saving:         false,
  error:          null,
  successMessage: null,
};

const idleSettingsSlice = createSlice({
  name: 'idleSettings',
  initialState,

  reducers: {
    updateIdleTimeoutRequest: (state) => {
      state.saving         = true;
      state.error          = null;
      state.successMessage = null;
    },
    updateIdleTimeoutSuccess: (state, action) => {
      state.timeoutMinutes = action.payload;
      state.saving         = false;
      state.successMessage = `Idle logout timeout updated to ${action.payload} minute${action.payload !== 1 ? 's' : ''}.`;
      try {
        localStorage.setItem(STORAGE_KEY, String(action.payload));
      } catch { /* quota error — ignore */ }
    },
    updateIdleTimeoutFailure: (state, action) => {
      state.saving = false;
      state.error  = action.payload;
    },
    clearSuccess: (state) => { state.successMessage = null; },
    clearError:   (state) => { state.error = null; },
  },
});

export const {
  updateIdleTimeoutRequest,
  updateIdleTimeoutSuccess,
  updateIdleTimeoutFailure,
  clearSuccess,
  clearError,
} = idleSettingsSlice.actions;

export default idleSettingsSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectIdleTimeoutMinutes  = (state) =>
  state.idleSettings?.timeoutMinutes ?? DEFAULT_TIMEOUT;

/** Used by useIdleLogout — returns milliseconds */
export const selectIdleTimeoutMs = (state) =>
  (state.idleSettings?.timeoutMinutes ?? DEFAULT_TIMEOUT) * 60 * 1000;

export const selectIdleSettingsSaving  = (state) => state.idleSettings?.saving         ?? false;
export const selectIdleSettingsError   = (state) => state.idleSettings?.error          ?? null;
export const selectIdleSettingsSuccess = (state) => state.idleSettings?.successMessage ?? null;
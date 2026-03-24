import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector }                  from 'react-redux';
import { logoutRequest }                             from '../modules/auth/authSlice';
import { selectIdleTimeoutMs }                       from '../modules/idleSettings/idleSettingsSlice';

/**
 * useIdleLogout
 *
 * Flow:
 *   User idle for (timeoutMs - 60s)
 *     → Warning modal appears with 60s countdown
 *     → If no action: dispatch(logoutRequest())
 *         → authSaga calls POST /api/auth/logout  ← backend hit
 *         → localStorage token cleared
 *         → redirect to /login
 *     → If "Stay Logged In" clicked: timer resets from scratch
 *
 * Timeout source:
 *   - Reads from Redux state.idleSettings.timeoutMinutes (default 5 min)
 *   - Admin can change it via SecuritySettings → updates Redux + localStorage
 *   - Change takes effect immediately (useEffect re-runs on timeoutMs change)
 *
 * Activity events that reset the timer:
 *   mousemove | keydown | click | scroll | touchstart
 *
 * @param {boolean} isLoggedIn - arms the hook only when true
 * @returns {{ warningVisible, secondsLeft, extendSession }}
 */

const ACTIVITY_EVENTS  = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
const WARNING_BEFORE_MS = 60 * 1000; // show warning 60s before logout

export default function useIdleLogout(isLoggedIn) {
  const dispatch  = useDispatch();
  const timeoutMs = useSelector(selectIdleTimeoutMs); // live from Redux

  const warningTimerRef  = useRef(null); // fires when idle → show warning
  const logoutTimerRef   = useRef(null); // fires 60s after warning → logout
  const countdownRef     = useRef(null); // 1-second tick for countdown display

  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft,    setSecondsLeft]    = useState(60);

  // ── Clear ALL timers ──────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(countdownRef.current);
    warningTimerRef.current  = null;
    logoutTimerRef.current   = null;
    countdownRef.current     = null;
  }, []);

  // ── Perform logout → hits POST /api/auth/logout via authSaga ─────────────
  const performLogout = useCallback(() => {
    clearAll();
    setWarningVisible(false);
    dispatch(logoutRequest()); // authSaga → logoutAPI → /api/auth/logout
  }, [dispatch, clearAll]);

  // ── Show warning modal + start 60s countdown ─────────────────────────────
  const startWarning = useCallback(() => {
    setWarningVisible(true);
    setSecondsLeft(60);

    // Tick every second to update countdown display
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // After 60s → actually logout (hits backend)
    logoutTimerRef.current = setTimeout(performLogout, WARNING_BEFORE_MS);
  }, [performLogout]);

  // ── Arm/reset idle timer ──────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    clearAll();
    setWarningVisible(false);

    if (!isLoggedIn) return;

    const warningDelay = timeoutMs - WARNING_BEFORE_MS;

    if (warningDelay <= 0) {
      // Timeout ≤ 60s: skip warning, logout immediately after timeoutMs
      logoutTimerRef.current = setTimeout(performLogout, timeoutMs);
    } else {
      // Normal path: show warning at (timeoutMs - 60s), logout 60s later
      warningTimerRef.current = setTimeout(startWarning, warningDelay);
    }
  }, [isLoggedIn, timeoutMs, clearAll, startWarning, performLogout]);

  // ── "Stay Logged In" — resets timer completely ────────────────────────────
  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // ── Attach / detach activity listeners ───────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      clearAll();
      setWarningVisible(false);
      return;
    }

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
    resetTimer(); // arm immediately on login or timeout change

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      clearAll();
    };
    // resetTimer closes over timeoutMs → re-runs when admin changes the setting
  }, [isLoggedIn, resetTimer, clearAll]);

  return { warningVisible, secondsLeft, extendSession };
}
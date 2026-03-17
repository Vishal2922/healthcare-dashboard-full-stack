import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logoutRequest } from '../modules/auth/authSlice';

/**
 * useIdleLogout
 *
 * Automatically dispatches logoutRequest after `timeoutMs` of inactivity.
 * Resets the timer on: mousemove, keydown, click, scroll, touchstart.
 *
 * Only active when isLoggedIn is true.
 *
 * @param {boolean} isLoggedIn  - Only arm the timer when user is authenticated
 * @param {number}  timeoutMs   - Inactivity duration before logout (default: 15 min)
 */
export default function useIdleLogout(isLoggedIn, timeoutMs = 15 * 60 * 1000) {
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      dispatch(logoutRequest());
    }, timeoutMs);
  }, [dispatch, timeoutMs]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
    resetTimer(); // Arm on mount

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, resetTimer]);
}
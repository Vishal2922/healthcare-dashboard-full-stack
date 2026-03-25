/**
 * networkMonitor.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a Redux-Saga EventChannel that emits network online/offline events.
 *
 * Strategy:
 *   Primary   → window online/offline events (instant, event-driven)
 *   Secondary → periodic navigator.onLine polling (catches missed transitions)
 *
 * Usage (in a saga):
 *   import { createNetworkChannel, checkOnline } from './networkMonitor';
 *
 *   function* watchNetwork() {
 *     const channel = yield call(createNetworkChannel);
 *     try {
 *       while (true) {
 *         const isOnline = yield take(channel);
 *         yield put(setOnlineStatus(isOnline));
 *         if (isOnline) yield call(flushQueues);
 *       }
 *     } finally {
 *       if (yield cancelled()) channel.close();
 *     }
 *   }
 */

import { eventChannel } from 'redux-saga';

const POLL_INTERVAL_MS = 8000; // 8-second fallback poll

/**
 * Returns true if currently online.
 */
export function checkOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Creates a Redux-Saga EventChannel that emits boolean online status.
 *
 * Emits:
 *   true  → network came back online
 *   false → network went offline
 *
 * The channel auto-emits the current status on creation.
 */
export function createNetworkChannel() {
  return eventChannel((emit) => {
    // Emit immediately so sagas have the current status at start
    emit(checkOnline());

    const onOnline  = () => { emit(true);  };
    const onOffline = () => { emit(false); };

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    // Polling fallback (catches transitions missed by events)
    let lastState = checkOnline();
    const pollId  = setInterval(() => {
      const current = checkOnline();
      if (current !== lastState) {
        lastState = current;
        emit(current);
      }
    }, POLL_INTERVAL_MS);

    // Cleanup
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(pollId);
    };
  });
}

/**
 * Attach a plain callback (for non-saga usage, e.g. React components).
 * Returns an unsubscribe function.
 *
 * @param {function(boolean): void} callback
 * @returns {function} unsubscribe
 */
export function subscribeToNetwork(callback) {
  const onOnline  = () => callback(true);
  const onOffline = () => callback(false);

  window.addEventListener('online',  onOnline);
  window.addEventListener('offline', onOffline);

  // Emit current state immediately
  callback(checkOnline());

  return () => {
    window.removeEventListener('online',  onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
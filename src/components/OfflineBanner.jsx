/**
 * OfflineBanner.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent top-of-screen banner shown when the user is offline or when
 * syncing a queued action.
 *
 * States:
 *   • OFFLINE   — red banner, shows pending count, retry button
 *   • SYNCING   — amber banner, spinner, "Syncing N items…"
 *   • SYNCED    — green flash banner for 3 seconds after sync completes
 *   • FAILED    — amber banner, shows failed count, dismiss button
 *   • ONLINE    — renders nothing (null)
 *
 * Usage:
 *   <OfflineBanner />   // place once in DashboardLayout.jsx
 */

import React, { useEffect, useRef, useState } from 'react';
import useOfflineQueue from '../hooks/useOfflineQueue';

// ── Inline styles (no external CSS dependency) ────────────────────────────────
const baseStyle = {
  position:       'fixed',
  top:            0,
  left:           0,
  right:          0,
  zIndex:         9999,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        '10px 20px',
  fontSize:       '0.8125rem',
  fontWeight:     500,
  fontFamily:     'inherit',
  gap:            '12px',
  boxShadow:      '0 2px 8px rgba(0,0,0,0.15)',
  transition:     'transform 0.25s ease, opacity 0.25s ease',
};

const THEMES = {
  offline: {
    background: '#dc2626',
    color:      '#fff',
  },
  syncing: {
    background: '#d97706',
    color:      '#fff',
  },
  synced: {
    background: '#16a34a',
    color:      '#fff',
  },
  failed: {
    background: '#92400e',
    color:      '#fff',
  },
};

const btnStyle = {
  background:    'rgba(255,255,255,0.22)',
  border:        '1px solid rgba(255,255,255,0.35)',
  borderRadius:  '6px',
  color:         '#fff',
  cursor:        'pointer',
  fontSize:      '0.75rem',
  fontWeight:    600,
  padding:       '3px 10px',
  whiteSpace:    'nowrap',
  transition:    'background 0.15s',
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14"
      style={{ animation: 'ehrSpin 0.75s linear infinite', flexShrink: 0 }}
    >
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <path d="M7 1.5 A5.5 5.5 0 0 1 12.5 7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes ehrSpin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const WifiOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function OfflineBanner() {
  const {
    isOnline,
    isFlushing,
    pendingCount,
    failedCount,
    lastSync,
    manualSync,
    dismissFailed,
  } = useOfflineQueue();

  const [showSynced, setShowSynced] = useState(false);
  const syncedTimerRef = useRef(null);
  const prevFlushing   = useRef(false);

  // Show "Synced!" flash after flush completes
  useEffect(() => {
    if (prevFlushing.current && !isFlushing && isOnline && pendingCount === 0) {
      setShowSynced(true);
      if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
      syncedTimerRef.current = setTimeout(() => setShowSynced(false), 3000);
    }
    prevFlushing.current = isFlushing;
  }, [isFlushing, isOnline, pendingCount]);

  useEffect(() => () => {
    if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
  }, []);

  // ── Determine which state to render ────────────────────────────────────────
  let theme  = null;
  let icon   = null;
  let label  = null;
  let action = null;

  if (!isOnline) {
    theme = THEMES.offline;
    icon  = <WifiOffIcon />;
    label = pendingCount > 0
      ? `You're offline — ${pendingCount} action${pendingCount > 1 ? 's' : ''} queued, will sync when reconnected`
      : "You're offline — changes will be saved locally and synced when reconnected";
  } else if (isFlushing) {
    theme = THEMES.syncing;
    icon  = <Spinner />;
    label = `Syncing ${pendingCount} queued item${pendingCount > 1 ? 's' : ''}…`;
  } else if (showSynced) {
    theme = THEMES.synced;
    icon  = <CheckIcon />;
    label = 'All changes synced successfully';
  } else if (failedCount > 0) {
    theme  = THEMES.failed;
    icon   = <AlertIcon />;
    label  = `${failedCount} action${failedCount > 1 ? 's' : ''} failed to sync`;
    action = (
      <button style={btnStyle} onClick={dismissFailed}>
        Dismiss
      </button>
    );
  } else if (isOnline && pendingCount > 0) {
    // Online but queue hasn't flushed yet (edge case — show sync button)
    theme  = THEMES.syncing;
    icon   = <AlertIcon />;
    label  = `${pendingCount} pending action${pendingCount > 1 ? 's' : ''} — ready to sync`;
    action = (
      <button style={btnStyle} onClick={manualSync}>
        Sync now
      </button>
    );
  }

  // Nothing to show
  if (!theme) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ ...baseStyle, ...theme }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        {icon}
        <span>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Show pending count badge */}
        {!isFlushing && !showSynced && pendingCount > 0 && isOnline && (
          <button style={btnStyle} onClick={manualSync}>
            Sync now
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
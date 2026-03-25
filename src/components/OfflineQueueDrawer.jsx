/**
 * OfflineQueueDrawer.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A slide-in drawer (from the right) that shows the full offline action queue
 * with status per item. Triggered by clicking a queue count badge in the Header.
 *
 * Usage:
 *   import OfflineQueueDrawer from './OfflineQueueDrawer';
 *
 *   const [drawerOpen, setDrawerOpen] = useState(false);
 *   <OfflineQueueDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
 */

import React from 'react';
import useOfflineQueue from '../hooks/useOfflineQueue';

// ── Module display config ─────────────────────────────────────────────────────
const MODULE_LABELS = {
  patients:      { label: 'Patient',      color: '#3b82f6', bg: '#eff6ff' },
  prescriptions: { label: 'Prescription', color: '#8b5cf6', bg: '#f5f3ff' },
  billing:       { label: 'Invoice',      color: '#10b981', bg: '#ecfdf5' },
  staff:         { label: 'Staff',        color: '#f59e0b', bg: '#fffbeb' },
};

const TYPE_LABELS = {
  create:       'Create',
  update:       'Update',
  delete:       'Delete',
  updateStatus: 'Update status',
};

const STATUS_CONFIG = {
  pending:    { color: '#d97706', bg: '#fef3c7', label: 'Pending' },
  processing: { color: '#3b82f6', bg: '#eff6ff', label: 'Syncing…' },
  success:    { color: '#16a34a', bg: '#dcfce7', label: 'Done' },
  failed:     { color: '#dc2626', bg: '#fee2e2', label: 'Failed' },
};

// ── Styles ────────────────────────────────────────────────────────────────────
const overlayStyle = (open) => ({
  position:   'fixed',
  inset:      0,
  zIndex:     8999,
  background: 'rgba(0,0,0,0.35)',
  opacity:    open ? 1 : 0,
  pointerEvents: open ? 'auto' : 'none',
  transition: 'opacity 0.2s',
});

const drawerStyle = (open) => ({
  position:   'fixed',
  top:        0,
  right:      0,
  bottom:     0,
  zIndex:     9000,
  width:      '380px',
  maxWidth:   '95vw',
  background: '#fff',
  boxShadow:  '-4px 0 24px rgba(0,0,0,0.12)',
  transform:  open ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
  display:    'flex',
  flexDirection: 'column',
  overflow:   'hidden',
});

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      fontSize:     '0.6875rem',
      fontWeight:   600,
      padding:      '2px 7px',
      borderRadius: '20px',
      color:        cfg.color,
      background:   cfg.bg,
      whiteSpace:   'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function ModuleBadge({ module }) {
  const cfg = MODULE_LABELS[module] || { label: module, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize:     '0.6875rem',
      fontWeight:   600,
      padding:      '2px 7px',
      borderRadius: '20px',
      color:        cfg.color,
      background:   cfg.bg,
      whiteSpace:   'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function QueueItem({ item }) {
  const timeAgo = (() => {
    const secs = Math.floor((Date.now() - item.timestamp) / 1000);
    if (secs < 60)  return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  })();

  return (
    <div style={{
      padding:      '10px 16px',
      borderBottom: '1px solid #f3f4f6',
      display:      'flex',
      gap:          '10px',
      alignItems:   'flex-start',
    }}>
      {/* Left: action type dot */}
      <div style={{
        width:        '8px',
        height:       '8px',
        borderRadius: '50%',
        background:   STATUS_CONFIG[item.status]?.color ?? '#9ca3af',
        marginTop:    '5px',
        flexShrink:   0,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <ModuleBadge module={item.module} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
          <StatusBadge status={item.status} />
        </div>

        <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>
          {timeAgo}
          {item.retries > 0 && (
            <span style={{ marginLeft: '8px', color: '#d97706' }}>
              · {item.retries} retry attempt{item.retries > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {item.errorMessage && (
          <div style={{
            marginTop:    '4px',
            fontSize:     '0.75rem',
            color:        '#dc2626',
            background:   '#fef2f2',
            borderRadius: '4px',
            padding:      '3px 7px',
            wordBreak:    'break-word',
          }}>
            {item.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────
export default function OfflineQueueDrawer({ open, onClose }) {
  const {
    isOnline,
    isFlushing,
    pendingCount,
    failedCount,
    allQueue,
    lastSync,
    manualSync,
    dismissFailed,
  } = useOfflineQueue();

  const handleSync = () => {
    manualSync();
  };

  const formattedLastSync = lastSync
    ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        style={overlayStyle(open)}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        style={drawerStyle(open)}
        role="dialog"
        aria-modal="true"
        aria-label="Offline Queue Status"
      >
        {/* Header */}
        <div style={{
          padding:        '16px 20px',
          borderBottom:   '1px solid #f3f4f6',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     '#fff',
          flexShrink:     0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>
              Offline Queue
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              {allQueue.length === 0
                ? 'No pending actions'
                : `${allQueue.length} action${allQueue.length > 1 ? 's' : ''} in queue`}
              {formattedLastSync && ` · Last sync ${formattedLastSync}`}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      '#6b7280',
              padding:    '4px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Status bar */}
        <div style={{
          padding:    '10px 20px',
          background: isOnline ? '#f0fdf4' : '#fef2f2',
          borderBottom: '1px solid #f3f4f6',
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          fontSize:   '0.8125rem',
          fontWeight: 500,
          color:      isOnline ? '#16a34a' : '#dc2626',
          flexShrink: 0,
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isOnline ? '#16a34a' : '#dc2626',
            flexShrink: 0,
            animation: !isOnline ? 'ehrPulse 1s infinite ease-in-out' : 'none',
          }} />
          <style>{`@keyframes ehrPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          {isOnline
            ? (isFlushing ? 'Syncing…' : 'Online')
            : 'Offline — changes saved locally'}
        </div>

        {/* Queue list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {allQueue.length === 0 ? (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '200px',
              color:          '#9ca3af',
              fontSize:       '0.875rem',
              gap:            '8px',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              All changes are synced
            </div>
          ) : (
            allQueue.map((item) => <QueueItem key={item.id} item={item} />)
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding:        '12px 20px',
          borderTop:      '1px solid #f3f4f6',
          display:        'flex',
          gap:            '8px',
          background:     '#fff',
          flexShrink:     0,
        }}>
          {isOnline && pendingCount > 0 && !isFlushing && (
            <button
              onClick={handleSync}
              style={{
                flex:         1,
                padding:      '8px 16px',
                background:   '#3b82f6',
                color:        '#fff',
                border:       'none',
                borderRadius: '8px',
                cursor:       'pointer',
                fontWeight:   600,
                fontSize:     '0.8125rem',
              }}
            >
              Sync {pendingCount} item{pendingCount > 1 ? 's' : ''} now
            </button>
          )}

          {failedCount > 0 && (
            <button
              onClick={dismissFailed}
              style={{
                flex:         1,
                padding:      '8px 16px',
                background:   '#fff',
                color:        '#6b7280',
                border:       '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor:       'pointer',
                fontWeight:   500,
                fontSize:     '0.8125rem',
              }}
            >
              Dismiss {failedCount} failed
            </button>
          )}

          {allQueue.length === 0 && (
            <button
              onClick={onClose}
              style={{
                flex:         1,
                padding:      '8px 16px',
                background:   '#f9fafb',
                color:        '#374151',
                border:       '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor:       'pointer',
                fontWeight:   500,
                fontSize:     '0.8125rem',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}
import React, { useEffect, useState, useCallback } from 'react';
import useAppointments from '../../modules/appointments/hooks/useAppointments';
import AppointmentForm from '../../components/forms/AppointmentForm';
import usePermission from '../../hooks/usePermission';

export default function AppointmentList() {
  const {
    list, pagination, loading, error, filters,
    isOnline, offlineQueue, offlineQueueCount, isDrainingQueue,
    loadAppointments, goToPage, updateStatus, cancelAppointment,
    filterByStatus, isRowLoading, clearError,
    bookingSuccess, resetBooking,
  } = useAppointments();

  const { can } = usePermission();

  const canCreate       = can('appointments', 'create');
  const canCancel       = can('appointments', 'cancel');
  const canUpdateStatus = can('appointments', 'updateStatus');

  const [showBookModal, setShowBookModal] = useState(false);

  useEffect(() => { loadAppointments({ page: 1 }); }, []); // eslint-disable-line

  // Close modal and refresh list after successful booking
  useEffect(() => {
    if (bookingSuccess) {
      setShowBookModal(false);
      resetBooking();
    }
  }, [bookingSuccess, resetBooking]);

  const handleFilterChange = useCallback(
    (e) => filterByStatus(e.target.value),
    [filterByStatus]
  );
  const handleStatusChange = useCallback(
    (id, s) => updateStatus(id, s),
    [updateStatus]
  );
  const handleCancel = useCallback(
    (id) => { if (window.confirm('Cancel this appointment?')) cancelAppointment(id); },
    [cancelAppointment]
  );

  const NEXT_STATUSES = {
    scheduled:         ['arrived', 'cancelled'],
    arrived:           ['in-consultation', 'cancelled'],
    'in-consultation': ['completed', 'cancelled'],
    completed:         [],
    cancelled:         [],
  };

  const STATUS_STYLE = {
    scheduled:         { color: '#2b6cb0', bg: '#ebf8ff' },
    arrived:           { color: '#975a16', bg: '#fffff0' },
    'in-consultation': { color: '#553c9a', bg: '#faf5ff' },
    completed:         { color: '#276749', bg: '#f0fff4' },
    cancelled:         { color: '#c53030', bg: '#fff5f5' },
  };

  const StatusBadge = ({ status }) => {
    const s = STATUS_STYLE[status] || { color: '#718096', bg: '#f7fafc' };
    return (
      <span style={{
        padding: '3px 10px', borderRadius: 12, fontSize: 11,
        fontWeight: 700, color: s.color, background: s.bg,
        textTransform: 'uppercase', letterSpacing: 0.4,
      }}>
        {status}
      </span>
    );
  };

  const renderPagination = () => {
    const { page, total_pages } = pagination;
    if (total_pages <= 1) return null;
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(total_pages, page + 2); i++) pages.push(i);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
        <button onClick={() => goToPage(page - 1)} disabled={page === 1 || loading} style={S.pageBtn}>‹ Prev</button>
        {pages.map((p) => (
          <button key={p} onClick={() => goToPage(p)} disabled={loading}
            style={{ ...S.pageBtn, ...(p === page ? S.activePage : {}) }}>{p}</button>
        ))}
        <button onClick={() => goToPage(page + 1)} disabled={page === total_pages || loading} style={S.pageBtn}>Next ›</button>
        <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 8 }}>
          Page {page} of {total_pages} · {pagination.total} total
        </span>
      </div>
    );
  };

  return (
    <div style={S.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Appointments</h1>
          <p style={S.subtitle}>Manage and track all clinic appointments</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!isOnline && (
            <div style={S.offlinePill}>
              📶 Offline
              {offlineQueueCount > 0 && <span style={S.badge}>{offlineQueueCount} queued</span>}
            </div>
          )}
          {isDrainingQueue && (
            <div style={S.drainingPill}>
              ⟳ Syncing {offlineQueueCount} action{offlineQueueCount !== 1 ? 's' : ''}…
            </div>
          )}
          {canCreate && (
            <button style={S.bookBtn} onClick={() => setShowBookModal(true)}>
              + Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5568' }}>Status:</label>
        <select value={filters.status} onChange={handleFilterChange} style={S.filterSelect}>
          <option value="">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="arrived">Arrived</option>
          <option value="in-consultation">In Consultation</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {loading && <span style={{ fontSize: 12, color: '#a0aec0' }}>Loading…</span>}
      </div>

      {/* ── Offline queue panel ─────────────────────────────────────────────── */}
      {offlineQueue.length > 0 && (
        <div style={S.queuePanel}>
          <strong>📋 Offline Queue ({offlineQueue.length})</strong>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#718096' }}>
            Will submit automatically on reconnect.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {offlineQueue.map((item) => (
              <span key={item.id} style={S.queueItem}>
                <strong>{item.type}</strong> · {new Date(item.queuedAt).toLocaleTimeString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={S.errorBanner}>
          <span>{error}</span>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c53030' }}>✕</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div style={S.tableWrapper}>
        {loading && list.length === 0 ? (
          <div style={S.empty}>Loading appointments…</div>
        ) : list.length === 0 ? (
          <div style={S.empty}>
            No appointments found.
            {canCreate && (
              <button style={S.inlineLink} onClick={() => setShowBookModal(true)}> Book one now</button>
            )}
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr style={{ background: '#f7fafc' }}>
                {/* FIX: added Appt ID and Patient ID columns */}
                {['Appt ID', 'Patient ID', 'Patient', 'Doctor', 'Date & Time', 'Reason', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((appt) => {
                const busy    = isRowLoading(appt.id);
                const next    = NEXT_STATUSES[appt.status] || [];
                const isFinal = ['completed', 'cancelled'].includes(appt.status);
                return (
                  <tr key={appt.id} style={{ borderBottom: '1px solid #edf2f7' }}>

                    {/* FIX: Appointment ID — styled as a monospace badge */}
                    <td style={S.td}>
                      <span style={S.idBadge}>#{appt.id}</span>
                    </td>

                    {/* FIX: Patient ID — styled as a monospace badge */}
                    <td style={S.td}>
                      <span style={S.idBadge}>#{appt.patient_id}</span>
                    </td>

                    {/* Patient name — falls back to Patient ID if name not resolved */}
                    <td style={S.td}>
                      <strong>
                        {appt.patient_name || <span style={{ color: '#a0aec0' }}>Unknown</span>}
                      </strong>
                    </td>

                    {/* Doctor name */}
                    <td style={S.td}>
                      {appt.doctor_name || `#${appt.doctor_id}`}
                    </td>

                    {/* Date & Time */}
                    <td style={S.td}>
                      <div>
                        {new Date(appt.appointment_time).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: 12, color: '#718096' }}>
                        {new Date(appt.appointment_time).toLocaleTimeString(undefined, {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Reason */}
                    <td style={{ ...S.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {appt.reason || <span style={{ color: '#a0aec0' }}>—</span>}
                    </td>

                    {/* Status */}
                    <td style={S.td}>
                      <StatusBadge status={appt.status} />
                    </td>

                    {/* Actions */}
                    <td style={S.td}>
                      {busy ? (
                        <span style={{ fontSize: 11, color: '#a0aec0' }}>Updating…</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {canUpdateStatus && next.filter((s) => s !== 'cancelled').map((s) => (
                            <button key={s} style={S.actionBtn} onClick={() => handleStatusChange(appt.id, s)}>
                              {s === 'arrived'          && '✓ Arrived'}
                              {s === 'in-consultation'  && '🩺 Consult'}
                              {s === 'completed'        && '✔ Complete'}
                            </button>
                          ))}
                          {canCancel && !isFinal && (
                            <button style={S.cancelBtn} onClick={() => handleCancel(appt.id)}>
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {renderPagination()}

      {/* ── Book Appointment Modal ───────────────────────────────────────────── */}
      {canCreate && showBookModal && (
        <AppointmentForm onClose={() => setShowBookModal(false)} />
      )}
    </div>
  );
}

const S = {
  page:         { padding: '28px 32px', fontFamily: "'DM Sans','Inter',sans-serif", background: '#f7f5f0', minHeight: '100vh' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title:        { margin: 0, fontSize: 26, fontWeight: 800, color: '#1a202c' },
  subtitle:     { margin: '4px 0 0', fontSize: 14, color: '#718096' },
  offlinePill:  { display: 'flex', alignItems: 'center', gap: 6, background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#856404' },
  drainingPill: { display: 'flex', alignItems: 'center', gap: 6, background: '#e9d8fd', border: '1px solid #805ad5', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#553c9a' },
  badge:        { background: '#ffc107', color: '#1a1a1a', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  bookBtn:      { background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  filterSelect: { border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: 13, color: '#2d3748', background: '#fff', cursor: 'pointer' },
  queuePanel:   { background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13 },
  queueItem:    { background: '#fff', border: '1px solid #f6e05e', borderRadius: 6, padding: '3px 10px', fontSize: 12 },
  errorBanner:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#c53030' },
  tableWrapper: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:           { padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: '#718096', borderBottom: '1px solid #edf2f7', whiteSpace: 'nowrap' },
  td:           { padding: '13px 16px', verticalAlign: 'middle', color: '#2d3748' },
  // FIX: new style for ID badges — monospace, muted, compact
  idBadge:      { display: 'inline-block', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#4a5568', background: '#edf2f7', borderRadius: 5, padding: '2px 7px', letterSpacing: 0.3 },
  actionBtn:    { padding: '4px 10px', borderRadius: 6, border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  cancelBtn:    { padding: '4px 10px', borderRadius: 6, border: '1px solid #fed7d7', background: '#fff5f5', color: '#c53030', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  empty:        { textAlign: 'center', padding: '60px 20px', color: '#a0aec0', fontSize: 14 },
  inlineLink:   { background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', padding: 0 },
  pageBtn:      { padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#4a5568', fontSize: 13, cursor: 'pointer' },
  activePage:   { background: '#3182ce', borderColor: '#3182ce', color: '#fff', fontWeight: 700 },
};
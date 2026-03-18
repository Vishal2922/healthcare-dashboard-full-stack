import React, { useEffect, useState, useMemo } from 'react';
import useAppointments from '../../modules/appointments/hooks/useAppointments';
import AppointmentForm from '../../components/forms/AppointmentForm';

export default function AppointmentCalendar() {
  const {
    list, loading, error, isOnline, offlineQueueCount, isDrainingQueue,
    loadAppointments, updateStatus, cancelAppointment, isRowLoading, clearError,
  } = useAppointments();

  const today = new Date();
  const [view, setView]                   = useState('month');
  const [currentDate, setCurrentDate]     = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAppt, setSelectedAppt]   = useState(null);

  useEffect(() => { loadAppointments({ page: 1, perPage: 100 }); }, [currentDate]); // eslint-disable-line

  const navigate = (dir) => setCurrentDate((d) => {
    const n = new Date(d);
    if (view === 'month') n.setMonth(n.getMonth() + dir);
    else if (view === 'week') n.setDate(n.getDate() + dir * 7);
    else n.setDate(n.getDate() + dir);
    return n;
  });

  const periodLabel = useMemo(() => {
    if (view === 'month') return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (view === 'week') {
      const start = getWeekStart(currentDate);
      const end   = new Date(start); end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [view, currentDate]);

  const byDate = useMemo(() => {
    const map = {};
    list.forEach((a) => {
      const d = a.appointment_time?.slice(0, 10);
      if (d) { if (!map[d]) map[d] = []; map[d].push(a); }
    });
    return map;
  }, [list]);

  const STATUS_STYLE = {
    scheduled:         { bg: '#ebf8ff', border: '#3182ce', text: '#2b6cb0' },
    arrived:           { bg: '#fffff0', border: '#d69e2e', text: '#975a16' },
    'in-consultation': { bg: '#faf5ff', border: '#805ad5', text: '#553c9a' },
    completed:         { bg: '#f0fff4', border: '#38a169', text: '#276749' },
    cancelled:         { bg: '#fff5f5', border: '#e53e3e', text: '#c53030' },
  };

  const ApptCard = ({ appt }) => {
    const s = STATUS_STYLE[appt.status] || STATUS_STYLE.scheduled;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}
        style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, color: s.text, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 4, overflow: 'hidden', opacity: appt.status === 'cancelled' ? 0.6 : 1 }}
        title={`${appt.patient_name || 'Patient'} · ${appt.appointment_time?.slice(11,16)} · ${appt.status}`}
      >
        <span style={{ flexShrink: 0, opacity: 0.8 }}>{appt.appointment_time?.slice(11, 16)}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.patient_name || `#${appt.patient_id}`}</span>
      </div>
    );
  };

  const renderMonth = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = today.toISOString().slice(0, 10);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} style={S.dayCell} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr === todayStr;
      const appts   = byDate[dateStr] || [];
      cells.push(
        <div key={dateStr} style={{ ...S.dayCell, background: isToday ? '#ebf8ff' : '#fff', border: isToday ? '1px solid #3182ce' : '1px solid #edf2f7', cursor: 'pointer' }}
          onClick={() => setShowBookModal(true)}>
          <div style={{ fontSize: 13, marginBottom: 3, fontWeight: isToday ? 800 : 500, color: isToday ? '#3182ce' : '#4a5568' }}>{d}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {appts.slice(0, 3).map((a) => <ApptCard key={a.id} appt={a} />)}
            {appts.length > 3 && <span style={{ fontSize: 10, color: '#a0aec0', paddingLeft: 4 }}>+{appts.length - 3} more</span>}
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontWeight: 700, fontSize: 11, color: '#718096', textTransform: 'uppercase', borderBottom: '1px solid #edf2f7', background: '#f7fafc' }}>{d}</div>
        ))}
        {cells}
      </div>
    );
  };

  const renderWeek = () => {
    const start = getWeekStart(currentDate);
    const todayStr = today.toISOString().slice(0, 10);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', minHeight: 400 }}>
        {Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; }).map((d) => {
          const dateStr = d.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const appts   = byDate[dateStr] || [];
          return (
            <div key={dateStr} style={{ borderRight: '1px solid #edf2f7', padding: '8px 6px', background: isToday ? '#ebf8ff' : '#fff' }}>
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, marginBottom: 8, color: isToday ? '#3182ce' : '#718096' }}>
                <span>{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <strong style={{ display: 'block', fontSize: 16 }}>{d.getDate()}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {appts.length === 0 ? <span style={{ color: '#e2e8f0', fontSize: 20, display: 'block', textAlign: 'center', marginTop: 16 }}>—</span> : appts.map((a) => <ApptCard key={a.id} appt={a} />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const appts   = byDate[dateStr] || [];
    return (
      <div>
        {Array.from({ length: 10 }, (_, i) => i + 9).map((h) => {
          const slotAppts = appts.filter((a) => a.appointment_time?.slice(11, 13) === String(h).padStart(2, '0'));
          return (
            <div key={h} style={{ display: 'flex', borderBottom: '1px solid #edf2f7', minHeight: 60 }}>
              <div style={{ width: 56, padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#a0aec0', textAlign: 'right', borderRight: '1px solid #edf2f7', flexShrink: 0 }}>
                {h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}
              </div>
              <div style={{ flex: 1, padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start' }}>
                {slotAppts.length === 0
                  ? <div style={{ width: '100%', cursor: 'pointer' }} onClick={() => setShowBookModal(true)}><span style={{ fontSize: 11, color: '#cbd5e0' }}>+ Book</span></div>
                  : slotAppts.map((a) => <ApptCard key={a.id} appt={a} />)
                }
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const NEXT_STATUSES = { scheduled: ['arrived','cancelled'], arrived: ['in-consultation','cancelled'], 'in-consultation': ['completed','cancelled'] };

  const DetailPanel = () => {
    if (!selectedAppt) return null;
    const busy    = isRowLoading(selectedAppt.id);
    const isFinal = ['completed','cancelled'].includes(selectedAppt.status);
    const next    = NEXT_STATUSES[selectedAppt.status] || [];
    return (
      <div onClick={() => setSelectedAppt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Appointment Detail</h3>
            <button onClick={() => setSelectedAppt(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#718096' }}>✕</button>
          </div>
          {[['Patient', selectedAppt.patient_name || `#${selectedAppt.patient_id}`], ['Doctor', selectedAppt.doctor_name || `#${selectedAppt.doctor_id}`], ['Time', new Date(selectedAppt.appointment_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })], ['Status', selectedAppt.status], ['Reason', selectedAppt.reason || '—']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f7fafc' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase' }}>{k}</span>
              <span style={{ fontSize: 13, color: '#2d3748', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
          {!isFinal && !busy && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {next.filter((s) => s !== 'cancelled').map((s) => (
                <button key={s} onClick={() => { updateStatus(selectedAppt.id, s); setSelectedAppt(null); }} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Mark: {s}
                </button>
              ))}
              <button onClick={() => { if (window.confirm('Cancel this appointment?')) { cancelAppointment(selectedAppt.id); setSelectedAppt(null); } }} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #fed7d7', background: '#fff5f5', color: '#c53030', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}
          {busy && <div style={{ marginTop: 12, fontSize: 12, color: '#a0aec0' }}>Updating…</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Appointment Calendar</h1>
          <p style={S.subtitle}>Visualise and manage appointments by date</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!isOnline && <div style={S.offlinePill}>📶 Offline{offlineQueueCount > 0 ? ` · ${offlineQueueCount} queued` : ''}</div>}
          {isDrainingQueue && <div style={S.drainingPill}>⟳ Syncing…</div>}
          <button style={S.bookBtn} onClick={() => setShowBookModal(true)}>+ Book Appointment</button>
        </div>
      </div>

      <div style={S.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={S.navBtn} onClick={() => navigate(-1)}>‹</button>
          <button style={S.navBtn} onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
          <button style={S.navBtn} onClick={() => navigate(1)}>›</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a202c', marginLeft: 4 }}>{periodLabel}</span>
          {loading && <span style={{ fontSize: 12, color: '#a0aec0' }}>…</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['month','week','day'].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ ...S.navBtn, ...(view === v ? { background: '#3182ce', borderColor: '#3182ce', color: '#fff', fontWeight: 700 } : {}) }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#c53030' }}>
          {error}<button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c53030' }}>✕</button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {view === 'month' && renderMonth()}
        {view === 'week'  && renderWeek()}
        {view === 'day'   && renderDay()}
      </div>

      <DetailPanel />
      {showBookModal && <AppointmentForm onClose={() => setShowBookModal(false)} doctors={[]} patients={[]} />}
    </div>
  );
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

const S = {
  page:        { padding: '28px 32px', fontFamily: "'DM Sans','Inter',sans-serif", minHeight: '100vh', background: '#f7f5f0' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 },
  title:       { margin: 0, fontSize: 26, fontWeight: 800, color: '#1a202c' },
  subtitle:    { margin: '4px 0 0', fontSize: 14, color: '#718096' },
  offlinePill: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#856404' },
  drainingPill:{ background: '#e9d8fd', border: '1px solid #805ad5', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#553c9a' },
  bookBtn:     { background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  toolbar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12, background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  navBtn:      { padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f7fafc', cursor: 'pointer', fontSize: 14, color: '#4a5568' },
  dayCell:     { minHeight: 100, padding: '6px 8px', boxSizing: 'border-box', borderRight: '1px solid #edf2f7' },
};
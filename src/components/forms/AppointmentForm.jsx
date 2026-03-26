import React, { useEffect, useCallback } from 'react';
import useAppointments from '../../modules/appointments/hooks/useAppointments';
import useAuth from '../../modules/auth/hooks/useAuth';
import { useTheme } from 'styled-components';

export default function AppointmentForm({ onClose, doctors = [], patients = [] }) {
  const {
    bookAppointment, checkSlotConflict, conflictCheck,
    bookingLoading, bookingError, bookingSuccess,
    resetBooking, resetConflict, isOnline, offlineQueueCount,
  } = useAppointments();

  const [form, setForm] = React.useState({
    patient_id: '', doctor_id: '', appointment_time: '', reason: '',
  });

  const theme = useTheme();
  const { user } = useAuth();
  const isPatient = user?.role === 'Patient';
  const textColor = theme?.colors?.text || '#1a202c';
  const textSecondary = theme?.colors?.textSecondary || '#4a5568';
  const surfaceBg = theme?.colors?.surface || '#fff';
  const inputBg = theme?.colors?.background || '#fff';
  const borderColor = theme?.colors?.border || '#e2e8f0';

  useEffect(() => {
    if (bookingSuccess) {
      const t = setTimeout(() => { resetBooking(); if (onClose) onClose(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [bookingSuccess]); // eslint-disable-line

  useEffect(() => {
    if (form.doctor_id && form.appointment_time) {
      checkSlotConflict({ doctor_id: form.doctor_id, appointment_time: form.appointment_time });
    } else {
      resetConflict();
    }
  }, [form.doctor_id, form.appointment_time]); // eslint-disable-line

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (conflictCheck.isAvailable === false) return;
    bookAppointment({
      patient_id:       isPatient ? 0 : Number(form.patient_id),
      doctor_id:        Number(form.doctor_id),
      appointment_time: form.appointment_time,
      reason:           form.reason || undefined,
    });
  }, [bookAppointment, form, conflictCheck.isAvailable]);

  const handleClose = useCallback(() => {
    resetBooking(); resetConflict(); if (onClose) onClose();
  }, [resetBooking, resetConflict, onClose]);

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  const isSubmitDisabled =
    bookingLoading || conflictCheck.checking ||
    conflictCheck.isAvailable === false ||
    (!isPatient && !form.patient_id) || !form.doctor_id || !form.appointment_time;

  return (
    <div style={S.overlay}>
      <div style={{ ...S.card, background: surfaceBg }}>
        <div style={S.header}>
          <h2 style={{ ...S.title, color: textColor }}>Book Appointment</h2>
          <button style={{ ...S.closeBtn, color: theme?.colors?.textSecondary || '#718096' }} onClick={handleClose} type="button">✕</button>
        </div>

        {!isOnline && (
          <div style={S.offlineBanner}>
            📶 Offline — booking will queue and sync on reconnect.
            {offlineQueueCount > 0 && <span style={S.badge}>{offlineQueueCount} queued</span>}
          </div>
        )}

        {bookingSuccess && <div style={S.successBanner}>✅ Appointment booked successfully!</div>}
        {bookingError   && <div style={S.errorBanner}>{bookingError}</div>}

        <form onSubmit={handleSubmit}>
          {!isPatient && (
            <div style={S.field}>
              <label style={{ ...S.label, color: textSecondary }} htmlFor="patient_id">Patient *</label>
              <select id="patient_id" name="patient_id" value={form.patient_id} onChange={handleChange} required style={{ ...S.input, background: inputBg, color: textColor, borderColor }}>
                <option value="">— Select patient —</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.patient_name || p.name || `#${p.id}`}</option>)}
              </select>
            </div>
          )}

          <div style={S.field}>
            <label style={{ ...S.label, color: textSecondary }} htmlFor="doctor_id">Doctor *</label>
            <select id="doctor_id" name="doctor_id" value={form.doctor_id} onChange={handleChange} required style={{ ...S.input, background: inputBg, color: textColor, borderColor }}>
              <option value="">— Select doctor —</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.username || d.full_name || `#${d.id}`}</option>)}
            </select>
          </div>

          <div style={S.field}>
            <label style={{ ...S.label, color: textSecondary }} htmlFor="appointment_time">Date & Time *</label>
            <input id="appointment_time" type="datetime-local" name="appointment_time" value={form.appointment_time} onChange={handleChange} min={minDateTime} required style={{ ...S.input, background: inputBg, color: textColor, borderColor }} />
            <div style={{ minHeight: 20, marginTop: 4, fontSize: 12 }}>
              {conflictCheck.checking && <span style={{ color: '#805ad5' }}>⏳ Checking availability…</span>}
              {conflictCheck.isAvailable === true  && <span style={{ color: '#2f855a' }}>✅ Slot available</span>}
              {conflictCheck.isAvailable === false && <span style={{ color: '#c53030', fontWeight: 600 }}>❌ Slot taken — pick another time</span>}
            </div>
          </div>

          <div style={S.field}>
            <label style={{ ...S.label, color: textSecondary }} htmlFor="reason">Reason (optional)</label>
            <textarea id="reason" name="reason" value={form.reason} onChange={handleChange} rows={3} style={{ ...S.input, resize: 'vertical', background: inputBg, color: textColor, borderColor }} placeholder="Brief reason for visit…" />
          </div>

          <div style={S.actions}>
            <button type="button" onClick={handleClose} style={{ ...S.cancelBtn, background: theme?.colors?.background || '#f7fafc', color: textSecondary, borderColor }} disabled={bookingLoading}>Cancel</button>
            <button
              type="submit"
              style={{ ...S.submitBtn, opacity: isSubmitDisabled ? 0.6 : 1, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}
              disabled={isSubmitDisabled}
            >
              {bookingLoading ? 'Booking…' : !isOnline ? '📶 Queue Booking' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const S = {
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '24px 16px' },
  card:          { background: '#fff', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: 'none', margin: 'auto' },
  header:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:         { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a202c' },
  closeBtn:      { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#718096' },
  offlineBanner: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#856404', display: 'flex', alignItems: 'center', gap: 8 },
  badge:         { background: '#ffc107', color: '#1a1a1a', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 'auto' },
  successBanner: { background: '#d4edda', border: '1px solid #28a745', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#155724' },
  errorBanner:   { background: '#f8d7da', border: '1px solid #dc3545', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#721c24' },
  field:         { marginBottom: 16 },
  label:         { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4a5568' },
  input:         { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, color: '#2d3748', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  actions:       { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn:     { padding: '9px 22px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#4a5568', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  submitBtn:     { padding: '9px 22px', borderRadius: 7, border: 'none', background: '#3182ce', color: '#fff', fontSize: 14, fontWeight: 600 },
};
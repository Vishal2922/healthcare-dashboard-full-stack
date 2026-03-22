/**
 * prescriptionPDF.js
 *
 * Generates and triggers a browser-print PDF download for a single prescription.
 * Opens an invisible iframe with a fully styled HTML prescription template,
 * calls window.print(), then removes the iframe — no external dependencies needed.
 *
 * Usage:
 *   import { downloadPrescriptionPDF } from '../../utils/prescriptionPDF';
 *   downloadPrescriptionPDF(prescription, clinicInfo);
 */

/**
 * @param {object} rx          - Prescription record from backend (decrypted)
 * @param {object} clinicInfo  - { name, address, phone, email, doctorName }
 */
export function downloadPrescriptionPDF(rx, clinicInfo = {}) {
  const clinic = {
    name:       clinicInfo.name       || 'ClinicOS Medical Centre',
    address:    clinicInfo.address    || '123 Health Street, Medical District',
    phone:      clinicInfo.phone      || '+91 98765 43210',
    email:      clinicInfo.email      || 'contact@clinicos.health',
    doctorName: clinicInfo.doctorName || rx.provider_name || 'Attending Physician',
  };

  const today      = new Date();
  const printDate  = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const issuedDate = rx.created_at
    ? new Date(rx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : printDate;

  const statusColor = rx.status === 'dispensed' ? '#16a34a' : '#d97706';
  const statusLabel = rx.status === 'dispensed'  ? 'DISPENSED' : 'PENDING';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prescription #${rx.id} — ${rx.patient_name || 'Patient'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 3px solid #0e1b2a;
      margin-bottom: 18px;
    }
    .clinic-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 44px; height: 44px;
      background: #20b486;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 22px; font-weight: 700;
      flex-shrink: 0;
    }
    .clinic-name {
      font-size: 20px;
      font-weight: 700;
      color: #0e1b2a;
      letter-spacing: -0.3px;
    }
    .clinic-tagline {
      font-size: 10px;
      color: #64748b;
      margin-top: 1px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .clinic-contact {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.7;
    }
    .clinic-contact strong { color: #0e1b2a; font-weight: 600; }

    /* ── Rx Title bar ── */
    .rx-title-bar {
      background: #0e1b2a;
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .rx-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .rx-meta {
      font-size: 11px;
      color: rgba(255,255,255,0.7);
      text-align: right;
      line-height: 1.6;
    }

    /* ── Info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-box {
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .info-box-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .info-row {
      display: flex;
      gap: 6px;
      margin-bottom: 3px;
    }
    .info-label {
      font-size: 11px;
      color: #64748b;
      min-width: 80px;
      font-weight: 500;
    }
    .info-value {
      font-size: 11px;
      color: #1a1a2e;
      font-weight: 600;
    }

    /* ── Rx body ── */
    .rx-symbol {
      font-size: 28px;
      font-weight: 300;
      color: #20b486;
      font-style: italic;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }

    .medicine-block {
      background: #f0fdf9;
      border: 1.5px solid #86efcf;
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 16px;
    }
    .medicine-number {
      font-size: 10px;
      font-weight: 700;
      color: #20b486;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .medicine-name {
      font-size: 18px;
      font-weight: 700;
      color: #0e1b2a;
      margin-bottom: 8px;
    }
    .medicine-details {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .med-detail {
      display: flex;
      flex-direction: column;
    }
    .med-detail-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .med-detail-value {
      font-size: 13px;
      font-weight: 600;
      color: #0e1b2a;
    }

    /* ── Notes ── */
    .notes-block {
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .notes-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .notes-text {
      font-size: 12px;
      color: #334155;
      line-height: 1.6;
    }

    /* ── Status badge ── */
    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      background: ${statusColor}18;
      color: ${statusColor};
      border: 1.5px solid ${statusColor}40;
    }
    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: ${statusColor};
    }
    .print-date {
      margin-left: auto;
      font-size: 10px;
      color: #94a3b8;
    }

    /* ── Signature area ── */
    .signature-area {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sig-block {
      text-align: center;
      min-width: 160px;
    }
    .sig-line {
      border-top: 1.5px solid #0e1b2a;
      margin-bottom: 6px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 600;
      color: #0e1b2a;
    }
    .sig-title {
      font-size: 10px;
      color: #64748b;
    }
    .sig-reg {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* ── Instructions box ── */
    .instructions {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 20px;
    }
    .instructions-title {
      font-size: 10px;
      font-weight: 700;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .instructions-text {
      font-size: 11px;
      color: #78350f;
      line-height: 1.5;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 16px;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      font-size: 9px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer-right {
      font-size: 9px;
      color: #94a3b8;
      text-align: right;
    }
    .footer-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 2px 6px;
    }

    @media print {
      body { background: #fff; }
      .page { padding: 8mm 10mm; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="clinic-logo">
        <div class="logo-icon">C</div>
        <div>
          <div class="clinic-name">${escapeHtml(clinic.name)}</div>
          <div class="clinic-tagline">Medical Prescription · Confidential</div>
        </div>
      </div>
      <div class="clinic-contact">
        <strong>${escapeHtml(clinic.address)}</strong><br/>
        📞 ${escapeHtml(clinic.phone)} &nbsp;|&nbsp; ✉ ${escapeHtml(clinic.email)}
      </div>
    </div>

    <!-- Rx Title Bar -->
    <div class="rx-title-bar">
      <div class="rx-title">PRESCRIPTION</div>
      <div class="rx-meta">
        Rx ID: #${rx.id}<br/>
        Issued: ${issuedDate}
      </div>
    </div>

    <!-- Patient & Doctor Info -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">Patient Information</div>
        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value">${escapeHtml(rx.patient_name || `Patient #${rx.patient_id}`)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Patient ID</span>
          <span class="info-value">#${rx.patient_id || '—'}</span>
        </div>
        ${rx.appointment_id ? `
        <div class="info-row">
          <span class="info-label">Appt. Ref</span>
          <span class="info-value">#${rx.appointment_id}</span>
        </div>` : ''}
      </div>
      <div class="info-box">
        <div class="info-box-title">Prescriber Information</div>
        <div class="info-row">
          <span class="info-label">Doctor</span>
          <span class="info-value">${escapeHtml(clinic.doctorName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Clinic</span>
          <span class="info-value">${escapeHtml(clinic.name)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${issuedDate}</span>
        </div>
      </div>
    </div>

    <!-- Rx Symbol -->
    <div class="rx-symbol">℞</div>

    <!-- Medicine Block -->
    <div class="medicine-block">
      <div class="medicine-number">Medication</div>
      <div class="medicine-name">${escapeHtml(rx.medicine_name_plain || 'Prescribed Medication')}</div>
      <div class="medicine-details">
        <div class="med-detail">
          <span class="med-detail-label">Dosage</span>
          <span class="med-detail-value">${escapeHtml(rx.dosage_plain || '—')}</span>
        </div>
        <div class="med-detail">
          <span class="med-detail-label">Duration</span>
          <span class="med-detail-value">${rx.duration_days ? `${rx.duration_days} days` : '—'}</span>
        </div>
        <div class="med-detail">
          <span class="med-detail-label">Route</span>
          <span class="med-detail-value">As directed</span>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <div class="instructions-title">⚠ Patient Instructions</div>
      <div class="instructions-text">
        Take medication strictly as prescribed. Do not alter dosage without consulting your doctor.
        Complete the full course even if symptoms improve. Keep out of reach of children.
        Store in a cool, dry place away from direct sunlight.
      </div>
    </div>

    ${rx.notes_plain ? `
    <!-- Notes -->
    <div class="notes-block">
      <div class="notes-title">Doctor's Notes</div>
      <div class="notes-text">${escapeHtml(rx.notes_plain)}</div>
    </div>` : ''}

    <!-- Status -->
    <div class="status-row">
      <div class="status-badge">
        <div class="status-dot"></div>
        ${statusLabel}
      </div>
      ${rx.status === 'dispensed' ? `<span style="font-size:11px;color:#64748b;">Dispensed by pharmacist</span>` : ''}
      <div class="print-date">Printed: ${printDate}</div>
    </div>

    <!-- Signature -->
    <div class="signature-area">
      <div>
        <div style="font-size:11px;color:#64748b;line-height:1.6;">
          This prescription is valid for <strong>30 days</strong> from issue date.<br/>
          Issued under tenant-isolated, AES-256 encrypted system.
        </div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(clinic.doctorName)}</div>
        <div class="sig-title">Prescribing Physician</div>
        <div class="sig-reg">${escapeHtml(clinic.name)}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        This document contains confidential medical information.<br/>
        Unauthorized use or disclosure is strictly prohibited.
      </div>
      <div class="footer-right">
        <div class="footer-badge">🔒 AES-256 Encrypted · JWT Protected</div><br/>
        ClinicOS · Prescription #${rx.id}
      </div>
    </div>

  </div>
</body>
</html>`;

  // Open in a hidden iframe and trigger print-as-PDF
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for fonts/images to load before printing
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Clean up after a delay (enough time for print dialog)
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 400);
  };
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
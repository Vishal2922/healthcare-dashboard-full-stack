/**
 * invoicePDF.js
 *
 * Generates and triggers a browser print-to-PDF for a single invoice.
 * Uses the same iframe + window.print() pattern as prescriptionPDF.js.
 * No external libraries needed.
 *
 * Usage:
 *   import { downloadInvoicePDF } from '../../utils/invoicePDF';
 *   downloadInvoicePDF(invoice, clinicInfo);
 */

/**
 * @param {object} invoice    - Invoice record from Redux (decrypted by backend)
 * @param {object} clinicInfo - Optional overrides: { name, address, phone, email, gstin }
 */
export function downloadInvoicePDF(invoice, clinicInfo = {}) {
  const clinic = {
    name:    clinicInfo.name    || 'ClinicOS Medical Centre',
    address: clinicInfo.address || '123 Health Street, Medical District',
    phone:   clinicInfo.phone   || '+91 98765 43210',
    email:   clinicInfo.email   || 'contact@clinicos.health',
    gstin:   clinicInfo.gstin   || '',
    themeColor: clinicInfo.themeColor || '#20b486',
  };

  const invoiceNumber = invoice.invoice_number
    || `INV-${String(invoice.id || '').padStart(4, '0')}`;

  const patientName = invoice.patient_name
    || invoice.patient?.name
    || invoice.patient?.full_name
    || `Patient #${invoice.patient_id}`;

  const providerName = invoice.provider_name || 'Attending Physician';

  const issuedDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Amounts
  const subtotal   = parseFloat(invoice.amount        || 0);
  const tax        = parseFloat(invoice.tax            || 0);
  const grandTotal = parseFloat(invoice.total_amount   || subtotal + tax);

  // Status styling
  const STATUS_STYLES = {
    paid:         { color: '#16a34a', label: 'PAID',         bg: '#f0fdf4', border: '#86efac' },
    pending:      { color: '#d97706', label: 'PENDING',      bg: '#fffbeb', border: '#fcd34d' },
    unpaid:       { color: '#d97706', label: 'UNPAID',       bg: '#fffbeb', border: '#fcd34d' },
    overdue:      { color: '#dc2626', label: 'OVERDUE',      bg: '#fef2f2', border: '#fca5a5' },
    cancelled:    { color: '#6b7280', label: 'CANCELLED',    bg: '#f9fafb', border: '#d1d5db' },
    partially_paid:{ color: '#0284c7', label: 'PARTIAL',     bg: '#eff6ff', border: '#93c5fd' },
    refunded:     { color: '#7c3aed', label: 'REFUNDED',     bg: '#f5f3ff', border: '#c4b5fd' },
  };
  const ss = STATUS_STYLES[invoice.status] || STATUS_STYLES.pending;

  // Line items — use invoice.items[] if present, else synthesise one row from amount
  const lineItems = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ description: 'Medical Services', quantity: 1, unit_price: subtotal }];

  const lineItemRows = lineItems.map((item, i) => {
    const qty      = Number(item.quantity   || 1);
    const price    = Number(item.unit_price || 0);
    const rowTotal = qty * price;
    return `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="td td-desc">${escapeHtml(item.description || '—')}</td>
        <td class="td td-num">${qty}</td>
        <td class="td td-num">${formatCurrency(price)}</td>
        <td class="td td-num td-total">${formatCurrency(rowTotal)}</td>
      </tr>`;
  }).join('');

  const taxRow = tax > 0 ? `
    <tr class="summary-row">
      <td colspan="3" class="summary-label">Tax</td>
      <td class="summary-value">${formatCurrency(tax)}</td>
    </tr>` : '';

  const paymentMethodRow = invoice.payment_method ? `
    <div class="meta-row">
      <span class="meta-label">Payment Method</span>
      <span class="meta-value">${escapeHtml(invoice.payment_method)}</span>
    </div>` : '';

  const paidAtRow = invoice.paid_at ? `
    <div class="meta-row">
      <span class="meta-label">Paid On</span>
      <span class="meta-value">${new Date(invoice.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
    </div>` : '';

  const appointmentRow = invoice.appointment_id ? `
    <div class="meta-row">
      <span class="meta-label">Appointment ID</span>
      <span class="meta-value">#${invoice.appointment_id}</span>
    </div>` : '';

  const notesSection = invoice.notes ? `
    <div class="notes-block">
      <div class="notes-title">Notes</div>
      <div class="notes-text">${escapeHtml(invoice.notes)}</div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNumber}</title>
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
      padding: 12mm 14mm 10mm;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 3px solid #0e1b2a;
      margin-bottom: 20px;
    }
    .clinic-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 46px; height: 46px;
      background: ${clinic.themeColor};
      border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 24px; font-weight: 800;
      flex-shrink: 0;
    }
    .clinic-name {
      font-size: 20px;
      font-weight: 700;
      color: #0e1b2a;
      letter-spacing: -0.3px;
    }
    .clinic-tagline {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }
    .clinic-contact {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.75;
    }
    .clinic-contact strong { color: #0e1b2a; font-weight: 600; }

    /* ── Title bar ── */
    .title-bar {
      background: #0e1b2a;
      color: #fff;
      padding: 10px 18px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .title-bar-left { }
    .invoice-word {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .invoice-num {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
      font-weight: 400;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${ss.bg};
      color: ${ss.color};
      border: 1.5px solid ${ss.border};
      border-radius: 20px;
      padding: 5px 14px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
    }
    .status-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: ${ss.color};
      flex-shrink: 0;
    }

    /* ── Info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 22px;
    }
    .info-box {
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .info-box-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      color: #94a3b8;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
    }
    .meta-row {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
      align-items: baseline;
    }
    .meta-label {
      font-size: 11px;
      color: #64748b;
      min-width: 90px;
      font-weight: 500;
      flex-shrink: 0;
    }
    .meta-value {
      font-size: 12px;
      color: #1a1a2e;
      font-weight: 600;
    }

    /* ── Line items table ── */
    .items-section-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1.5px solid #e2e8f0;
    }
    .items-table thead {
      background: #0e1b2a;
      color: #fff;
    }
    .th {
      padding: 9px 14px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      text-align: left;
    }
    .th.th-num { text-align: right; }
    .td {
      padding: 10px 14px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .td-desc { color: #1e293b; }
    .td-num  { text-align: right; color: #475569; }
    .td-total { font-weight: 600; color: #0e1b2a; }
    .row-even { background: #fff; }
    .row-odd  { background: #f8fafc; }

    /* ── Totals ── */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 0;
    }
    .totals-table {
      width: 260px;
      border-collapse: collapse;
      border: 1.5px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }
    .summary-row td { padding: 8px 14px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
    .summary-label { color: #64748b; text-align: right; }
    .summary-value { text-align: right; font-weight: 600; color: #0e1b2a; width: 90px; }
    .grand-total-row td {
      padding: 10px 14px;
      background: #0e1b2a;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
    }
    .grand-label { text-align: right; }
    .grand-value { text-align: right; font-size: 15px; }

    /* ── Notes ── */
    .notes-block {
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-top: 18px;
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

    /* ── Terms ── */
    .terms-block {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 16px;
      font-size: 10.5px;
      color: #78350f;
      line-height: 1.6;
    }
    .terms-title {
      font-weight: 700;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #92400e;
      margin-bottom: 4px;
    }

    /* ── Signature ── */
    .signature-area {
      margin-top: auto;
      padding-top: 28px;
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
    .sig-name  { font-size: 12px; font-weight: 600; color: #0e1b2a; }
    .sig-title { font-size: 10px; color: #64748b; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 18px;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left  { font-size: 9px; color: #94a3b8; line-height: 1.6; }
    .footer-right { font-size: 9px; color: #94a3b8; text-align: right; }
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

    <!-- ── Header ── -->
    <div class="header">
      <div class="clinic-brand">
        <div class="logo-icon">C</div>
        <div>
          <div class="clinic-name">${escapeHtml(clinic.name)}</div>
          <div class="clinic-tagline">Tax Invoice · Confidential</div>
        </div>
      </div>
      <div class="clinic-contact">
        <strong>${escapeHtml(clinic.address)}</strong><br/>
        📞 ${escapeHtml(clinic.phone)}<br/>
        ✉ ${escapeHtml(clinic.email)}
        ${clinic.gstin ? `<br/><strong>GSTIN:</strong> ${escapeHtml(clinic.gstin)}` : ''}
      </div>
    </div>

    <!-- ── Title bar ── -->
    <div class="title-bar">
      <div class="title-bar-left">
        <div class="invoice-word">Invoice</div>
        <div class="invoice-num">${escapeHtml(invoiceNumber)}</div>
      </div>
      <div class="status-pill">
        <div class="status-dot"></div>
        ${ss.label}
      </div>
    </div>

    <!-- ── Info grid ── -->
    <div class="info-grid">

      <!-- Bill To -->
      <div class="info-box">
        <div class="info-box-title">Bill To</div>
        <div class="meta-row">
          <span class="meta-label">Patient</span>
          <span class="meta-value">${escapeHtml(patientName)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Patient ID</span>
          <span class="meta-value">#${invoice.patient_id || '—'}</span>
        </div>
        ${appointmentRow}
        ${paymentMethodRow}
        ${paidAtRow}
      </div>

      <!-- Invoice Details -->
      <div class="info-box">
        <div class="info-box-title">Invoice Details</div>
        <div class="meta-row">
          <span class="meta-label">Invoice No.</span>
          <span class="meta-value">${escapeHtml(invoiceNumber)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Issue Date</span>
          <span class="meta-value">${issuedDate}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Due Date</span>
          <span class="meta-value">${dueDate}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Provider</span>
          <span class="meta-value">${escapeHtml(providerName)}</span>
        </div>
      </div>
    </div>

    <!-- ── Line Items ── -->
    <div class="items-section-title">Services & Items</div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="th">Description</th>
          <th class="th th-num">Qty</th>
          <th class="th th-num">Unit Price</th>
          <th class="th th-num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>

    <!-- ── Totals ── -->
    <div class="totals-wrap">
      <table class="totals-table">
        <tr class="summary-row">
          <td class="summary-label">Subtotal</td>
          <td class="summary-value">${formatCurrency(subtotal)}</td>
        </tr>
        ${taxRow}
        <tr class="grand-total-row">
          <td class="grand-label">Total</td>
          <td class="grand-value">${formatCurrency(grandTotal)}</td>
        </tr>
      </table>
    </div>

    ${notesSection}

    <!-- ── Terms ── -->
    <div class="terms-block">
      <div class="terms-title">⚠ Payment Terms &amp; Conditions</div>
      Payment is due by the date indicated above. Late payments may attract additional charges.
      This is a computer-generated invoice and does not require a physical signature.
      For queries, contact us at ${escapeHtml(clinic.email)} or ${escapeHtml(clinic.phone)}.
    </div>

    <!-- ── Signature ── -->
    <div class="signature-area">
      <div style="font-size:10px;color:#64748b;line-height:1.7;">
        Printed on: ${printDate}<br/>
        System: ClinicOS · AES-256 encrypted · Tenant-isolated
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(providerName)}</div>
        <div class="sig-title">Authorized Signatory</div>
      </div>
    </div>

    <!-- ── Footer ── -->
    <div class="footer">
      <div class="footer-left">
        This document is confidential and intended solely for the named patient.<br/>
        Unauthorized disclosure or reproduction is prohibited.
      </div>
      <div class="footer-right">
        <div class="footer-badge">🔒 AES-256 · JWT · HIPAA-aligned</div><br/>
        ${escapeHtml(clinic.name)} · ${escapeHtml(invoiceNumber)}
      </div>
    </div>

  </div>
</body>
</html>`;

  // ── Open in hidden iframe and trigger print dialog ─────────────────────────
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 500);
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
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
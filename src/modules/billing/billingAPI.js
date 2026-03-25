import axiosClient from '../../services/axiosClient';

/**
 * billingAPI — Module 11: Billing & Payments
 *
 * Backend routes — /api/billing
 *
 * RBAC (from routes/api.php):
 *   $billingStaff = Admin, Provider
 *   $billingAll   = Admin, Provider, Patient
 *   $adminOnly    = Admin only
 *
 *   GET    /api/billing/summary              → billingStaff
 *   GET    /api/billing/invoices             → billingAll
 *   GET    /api/billing/invoices/:id         → billingAll
 *   POST   /api/billing/invoices             → billingStaff + CSRF
 *   PATCH  /api/billing/invoices/:id/status  → billingAll + CSRF
 *   DELETE /api/billing/invoices/:id         → adminOnly
 */

// ─── Summary (dashboard stats) ───────────────────────────────────────────────
export const fetchBillingSummaryAPI = async () => {
  const response = await axiosClient.get('/api/billing/summary');
  return response.data;
  // shape: { status, data: { total_invoices, paid, unpaid, overdue, revenue_this_month, ... } }
};

// ─── Invoice List ─────────────────────────────────────────────────────────────
export const fetchInvoiceListAPI = async (params = {}) => {
  // Convert page/per_page to limit/skip for the backend
  const page    = params.page     || 1;
  const perPage = params.per_page || 10;
  const skip    = (page - 1) * perPage;
  const limit   = perPage;

  // Build API params: limit + skip + filters (strip page/per_page/_prefetch)
  const { page: _p, per_page: _pp, _prefetch, forceRefresh, ...filters } = params;
  const apiParams = { limit, skip, ...filters };

  const response = await axiosClient.get('/api/billing/invoices', { params: apiParams });
  return response.data;
  // shape: { status, data: { data: [...invoices], meta: { total, page, per_page, last_page } } }
};

// ─── Single Invoice ───────────────────────────────────────────────────────────
export const fetchInvoiceByIdAPI = async (id) => {
  const response = await axiosClient.get(`/api/billing/invoices/${id}`);
  return response.data;
  // shape: { status, data: { invoice: { ...invoice, items: [...] } } }
};

// ─── Create Invoice ───────────────────────────────────────────────────────────
export const createInvoiceAPI = async (payload) => {
  // payload: { patient_id, appointment_id, items: [{description, quantity, unit_price}], notes, due_date }
  const response = await axiosClient.post('/api/billing/invoices', payload);
  return response.data;
  // shape: { status, message, data: { invoice } }
};

// ─── Update Invoice Status ────────────────────────────────────────────────────
export const updateInvoiceStatusAPI = async ({ id, status, payment_method, payment_note }) => {
  // status: 'paid' | 'unpaid' | 'cancelled' | 'overdue'
  const response = await axiosClient.patch(`/api/billing/invoices/${id}/status`, {
    status,
    payment_method,
    payment_note,
  });
  return response.data;
  // shape: { status, message, data: { invoice } }
};

// ─── Delete Invoice (Admin only) ──────────────────────────────────────────────
export const deleteInvoiceAPI = async (id) => {
  const response = await axiosClient.delete(`/api/billing/invoices/${id}`);
  return response.data;
  // shape: { status, message }
};

/**
 * prescriptionAPI — Prescription Module
 *
 * Backend routes:
 *   GET    /api/prescriptions       → list   (Provider, Pharmacist, Admin)
 *   POST   /api/prescriptions       → create (Provider only + CSRF)
 *   PUT    /api/prescriptions/{id}  → update (Provider, Pharmacist, Admin + CSRF)
 */
import axiosClient from '../../services/axiosClient';

// ─── Fetch All (by tenant, with optional query params) ────────────────────────
export const fetchPrescriptionsAPI = async (params = {}) => {
  const page    = params.page     || 1;
  const perPage = params.per_page ?? 5;

  // Backend expects `page` + `per_page`. Strip internal flags and empty filters.
  const { page: _p, per_page: _pp, _prefetch, forceRefresh, ...filters } = params;
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );

  const apiParams = { page, per_page: perPage, ...cleaned };

  const response = await axiosClient.get('/api/prescriptions', { params: apiParams });
  return response.data?.data ?? response.data;
};

// ─── Fetch by Patient ─────────────────────────────────────────────────────────
export const fetchPrescriptionsByPatientAPI = async (patientId) => {
  const response = await axiosClient.get('/api/prescriptions', {
    params: { patient_id: patientId },
  });
  return response.data?.data ?? response.data;
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const createPrescriptionAPI = async (payload) => {
  const response = await axiosClient.post('/api/prescriptions', payload);
  return response.data;
};

// ─── Update (status, dosage, medicine_name) ───────────────────────────────────
export const updatePrescriptionAPI = async ({ id, ...payload }) => {
  const response = await axiosClient.put(`/api/prescriptions/${id}`, payload);
  return response.data;
};
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
  const response = await axiosClient.get('/api/prescriptions', { params });
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
import axiosClient from '../../services/axiosClient';

/**
 * patientAPI — Module 8: Patient Management
 *
 * Thin API layer. Only this file talks to axiosClient.
 * Saga calls these functions via `yield call(...)`.
 *
 * Backend routes  →  /api/patients  (clinicStaff = Admin,Provider,Nurse,Receptionist)
 *   GET    /api/patients         → paginated list  (clinicStaff)
 *   GET    /api/patients/:id     → single profile  (clinicStaff)
 *   POST   /api/patients         → create patient  (clinicStaff + CSRF)
 *   PUT    /api/patients/:id     → update patient  (clinicStaff + CSRF)
 *   DELETE /api/patients/:id     → delete patient  (Admin only)
 */

// ─── List (paginated + filterable) ──────────────────────────────────────────
export const fetchPatientListAPI = async (params = {}) => {
  // params: { page, per_page, search, gender, status }
  const response = await axiosClient.get('/api/patients', { params });
  return response.data;
  // shape: { status, data: { data: [...patients], meta: { total, page, per_page, last_page } } }
};

// ─── Single Patient ──────────────────────────────────────────────────────────
export const fetchPatientByIdAPI = async (id) => {
  const response = await axiosClient.get(`/api/patients/${id}`);
  return response.data;
  // shape: { status, data: { patient: {...} } }
};

// ─── Create ──────────────────────────────────────────────────────────────────
export const createPatientAPI = async (payload) => {
  // payload: { full_name, dob, gender, phone, email, address, blood_group, ... }
  const response = await axiosClient.post('/api/patients', payload);
  return response.data;
  // shape: { status, message, data: { patient } }
};

// ─── Update ──────────────────────────────────────────────────────────────────
export const updatePatientAPI = async ({ id, ...payload }) => {
  const response = await axiosClient.put(`/api/patients/${id}`, payload);
  return response.data;
  // shape: { status, message, data: { patient } }
};

// ─── Delete (Admin only — backend enforces) ───────────────────────────────────
export const deletePatientAPI = async (id) => {
  const response = await axiosClient.delete(`/api/patients/${id}`);
  return response.data;
  // shape: { status, message }
};

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
  const page    = params.page     || 1;
  const perPage = params.per_page ?? 5;

  // Backend expects `page` + `per_page`. Strip internal flags and empty filters.
  const { page: _p, per_page: _pp, _prefetch, forceRefresh, ...filters } = params;
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );

  const apiParams = { page, per_page: perPage, ...cleaned };

  const response = await axiosClient.get('/api/patients', { params: apiParams });
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
  const backendPayload = {
    ...payload,
    name: payload.full_name,
    medical_history: [
      payload.allergies ? `Allergies: ${payload.allergies}` : '',
      payload.chronic_conditions ? `Chronic: ${payload.chronic_conditions}` : '',
      payload.current_medications ? `Medications: ${payload.current_medications}` : '',
      payload.notes ? `Notes: ${payload.notes}` : ''
    ].filter(Boolean).join('\n') || 'None',
  };
  const response = await axiosClient.post('/api/patients', backendPayload);
  return response.data;
};

// ─── Update ──────────────────────────────────────────────────────────────────
export const updatePatientAPI = async ({ id, ...payload }) => {
  const backendPayload = {
    ...payload,
    name: payload.full_name,
    medical_history: [
      payload.allergies ? `Allergies: ${payload.allergies}` : '',
      payload.chronic_conditions ? `Chronic: ${payload.chronic_conditions}` : '',
      payload.current_medications ? `Medications: ${payload.current_medications}` : '',
      payload.notes ? `Notes: ${payload.notes}` : ''
    ].filter(Boolean).join('\n') || 'None',
  };
  const response = await axiosClient.put(`/api/patients/${id}`, backendPayload);
  return response.data;
};

// ─── Delete (Admin only — backend enforces) ───────────────────────────────────
export const deletePatientAPI = async (id) => {
  const response = await axiosClient.delete(`/api/patients/${id}`);
  return response.data;
  // shape: { status, message }
};

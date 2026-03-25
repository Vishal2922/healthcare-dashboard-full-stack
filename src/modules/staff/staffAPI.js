/**
 * staffAPI.js  (UPDATED — adds createStaffMemberAPI + updateStaffMemberAPI)
 * ─────────────────────────────────────────────────────────────────────────────
 * New endpoints for offline-queue-capable staff mutations.
 * Also adds getStaffMembersAPI for the full list endpoint.
 */

import axiosClient from '../../services/axiosClient';

// ── Existing API functions (unchanged) ───────────────────────────────────────

// GET /api/users/roles
export const fetchAllRolesAPI = async () => {
  const response = await axiosClient.get('/api/users/roles');
  return response.data;
};

// GET /api/users/roles  (permissions embedded inside roles)
export const fetchAllPermissionsAPI = async () => {
  const response = await axiosClient.get('/api/users/roles');
  return response.data;
};

// GET /api/staff?role_id={id}
export const fetchStaffByRoleAPI = async (roleId, params = {}) => {
  const response = await axiosClient.get('/api/staff', {
    params: { role_id: roleId, ...params },
  });
  return response.data;
};

// PUT /api/staff/{id}  { role_id }
export const assignRoleAPI = async (staffId, roleId) => {
  const response = await axiosClient.put(`/api/staff/${staffId}`, { role_id: roleId });
  return response.data;
};

// PUT /api/staff/{id}  { user_status: 'active' }
export const activateStaffAPI = async (staffId) => {
  const response = await axiosClient.put(`/api/staff/${staffId}`, { user_status: 'active' });
  return response.data;
};

// PUT /api/staff/{id}  { user_status: 'inactive' }
export const deactivateStaffAPI = async (staffId) => {
  const response = await axiosClient.put(`/api/staff/${staffId}`, { user_status: 'inactive' });
  return response.data;
};

// ── NEW API functions ─────────────────────────────────────────────────────────

/**
 * GET /api/staff
 * Fetch all staff members (paginated).
 * @param {{ page?, per_page?, role_id?, search? }} params
 */
export const getStaffMembersAPI = async (params = {}) => {
  const response = await axiosClient.get('/api/staff', { params });
  return response.data;
  // shape: { status, data: { staff: [...], pagination: {...} } }
};

/**
 * GET /api/staff/{id}
 * Fetch a single staff member.
 */
export const getStaffMemberByIdAPI = async (id) => {
  const response = await axiosClient.get(`/api/staff/${id}`);
  return response.data;
};

/**
 * POST /api/staff
 * Create a new staff member.
 *
 * The backend /api/staff is Admin only (AuthorizeRole:Admin).
 * Payload shape mirrors what StaffController::store expects.
 *
 * @param {{
 *   role_id:        number,
 *   username:       string,
 *   email:          string,
 *   password:       string,
 *   full_name:      string,
 *   phone?:         string,
 *   department?:    string,
 *   specialization?:string,
 *   hire_date?:     string,
 * }} payload
 */
export const createStaffMemberAPI = async (payload) => {
  const response = await axiosClient.post('/api/staff', payload);
  return response.data;
  // shape: { status, message, data: { staff: {...} } }
};

/**
 * PUT /api/staff/{id}
 * Update a staff member's profile.
 *
 * @param {{ id: number, ...fields }} payload
 */
export const updateStaffMemberAPI = async ({ id, ...payload }) => {
  const response = await axiosClient.put(`/api/staff/${id}`, payload);
  return response.data;
  // shape: { status, message, data: { staff: {...} } }
};

/**
 * DELETE /api/staff/{id}
 * Remove (soft-delete) a staff member.
 * Admin only.
 */
export const deleteStaffMemberAPI = async (id) => {
  const response = await axiosClient.delete(`/api/staff/${id}`);
  return response.data;
};
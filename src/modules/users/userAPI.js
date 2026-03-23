import axiosClient from '../../services/axiosClient';

/**
 * userAPI — User & Staff Management
 *
 * Routes used:
 *   GET  /api/users          → list all registered users (for picker dropdown)
 *   GET  /api/users/roles    → list all roles
 *   GET  /api/staff          → list staff members (table)
 *   GET  /api/staff/{id}     → single staff record
 *   POST /api/staff          → create staff record (link user → staff)
 *   PUT  /api/staff/{id}     → update staff record
 *   DELETE /api/staff/{id}   → soft-delete staff record
 *   GET  /api/staff/departments → department list for autocomplete
 *
 * FIX Bug 1: toggleUserStatusAPI sends BOTH user_status AND status
 * FIX Bug 5: fetchAllUsersAPI added for the "Add Staff" user picker
 */

// ─── GET /api/users — All registered users (for picker dropdown) ─────────────
// Used in the "Add Staff" modal to let admin pick an existing user.
// Requires backend route: GET /api/users  → UserController::index
export const fetchAllUsersAPI = async (params = {}) => {
  const response = await axiosClient.get('/api/users', { params });
  return response.data;
  // shape: { message, data: { users: [...], pagination: {...} } }
};

// ─── GET /api/staff — Staff list (paginated + filterable) ────────────────────
export const fetchUsersAPI = async (params = {}) => {
  const response = await axiosClient.get('/api/staff', { params });
  return response.data;
  // shape: { message, data: { staff: [...], pagination: {...} } }
};

// ─── GET /api/staff/{id} ─────────────────────────────────────────────────────
export const fetchUserByIdAPI = async (id) => {
  const response = await axiosClient.get(`/api/staff/${id}`);
  return response.data;
};

// ─── POST — Register user account + create staff profile in one shot ─────────
// Step 1: POST /api/auth/register  → creates user account, returns user_id
// Step 2: POST /api/staff          → links user_id to a staff record
export const createUserAPI = async (data) => {
  // Step 1 — Register the user account
  const registerResponse = await axiosClient.post('/api/auth/register', {
    username:  data.username,
    email:     data.email,
    password:  data.password,
    full_name: data.full_name,
    role_id:   data.role_id || undefined,
  });

  const registerData = registerResponse.data?.data || registerResponse.data;
  const userId = registerData?.user_id;

  if (!userId) {
    throw new Error('Registration succeeded but no user_id was returned.');
  }

  // Step 2 — Create the staff profile linked to the new user
  const staffResponse = await axiosClient.post('/api/staff', {
    user_id:        userId,
    role_id:        data.role_id        || undefined,
    department:     data.department     || undefined,
    specialization: data.specialization || undefined,
    hire_date:      data.hire_date      || undefined,
    status:         data.status         || 'active',
  });

  return staffResponse.data;
};

// ─── PUT /api/staff/{id} ─────────────────────────────────────────────────────
export const updateUserAPI = async (id, data) => {
  const response = await axiosClient.put(`/api/staff/${id}`, data);
  return response.data;
};

// ─── DELETE /api/staff/{id} ──────────────────────────────────────────────────
export const deleteUserAPI = async (id) => {
  const response = await axiosClient.delete(`/api/staff/${id}`);
  return response.data;
};

// ─── PUT /api/staff/{id} — Toggle active / inactive ─────────────────────────
// FIX Bug 1: Send BOTH fields so both users table AND staff table update correctly.
export const toggleUserStatusAPI = async (id, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const response  = await axiosClient.put(`/api/staff/${id}`, {
    user_status: newStatus,   // updates users.status
    status:      newStatus,   // updates staff.status  ← FIX
  });
  return response.data;
};

// ─── GET /api/staff/departments ──────────────────────────────────────────────
export const fetchDepartmentsAPI = async () => {
  const response = await axiosClient.get('/api/staff/departments');
  return response.data;
  // shape: { message, data: { departments: ['Cardiology', ...] } }
};

// ─── GET /api/users/roles ────────────────────────────────────────────────────
export const fetchRolesAPI = async () => {
  const response = await axiosClient.get('/api/users/roles');
  return response.data;
  // shape: { message, data: { roles: [...] } }
};
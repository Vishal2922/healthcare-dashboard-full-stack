import axiosClient from '../../services/axiosClient';

// GET  /api/staff  — list with filters
export const fetchUsersAPI = async (params = {}) => {
  const response = await axiosClient.get('/api/staff', { params });
  return response.data;
};

// GET  /api/staff/{id}
export const fetchUserByIdAPI = async (id) => {
  const response = await axiosClient.get(`/api/staff/${id}`);
  return response.data;
};

/**
 * Create a new staff member — two-step process matching the backend design:
 *   Step 1: POST /api/auth/register  → creates the user account, returns user_id
 *   Step 2: POST /api/staff          → creates the staff profile linked to user_id
 *
 * The backend POST /api/staff requires an existing user_id (by design).
 * POST /api/auth/register accepts: username, email, password, full_name, role_id
 * Password policy: min 8 chars, uppercase + lowercase + number + special char (@$!%*?&)
 */
export const createUserAPI = async (data) => {
  // Step 1 — Register user account
  const registerResponse = await axiosClient.post('/api/auth/register', {
    username:  data.username,
    email:     data.email,
    password:  data.password,
    full_name: data.full_name,
    role_id:   data.role_id || undefined,
  });

  const registerData = registerResponse.data?.data || registerResponse.data;
  const userId = registerData.user_id;

  if (!userId) {
    throw new Error('Registration succeeded but no user_id returned');
  }

  // Step 2 — Create staff profile linked to the new user
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

// PUT  /api/staff/{id}
export const updateUserAPI = async (id, data) => {
  const response = await axiosClient.put(`/api/staff/${id}`, data);
  return response.data;
};

// DELETE /api/staff/{id}
export const deleteUserAPI = async (id) => {
  const response = await axiosClient.delete(`/api/staff/${id}`);
  return response.data;
};

// PUT  /api/staff/{id}  { user_status: 'active'|'inactive' }
export const toggleUserStatusAPI = async (id, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const response  = await axiosClient.put(`/api/staff/${id}`, {
    user_status: newStatus,
  });
  return response.data;
};

// GET  /api/staff/departments
export const fetchDepartmentsAPI = async () => {
  const response = await axiosClient.get('/api/staff/departments');
  return response.data;
};

// GET  /api/users/roles
export const fetchRolesAPI = async () => {
  const response = await axiosClient.get('/api/users/roles');
  return response.data;
};
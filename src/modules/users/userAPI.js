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

// POST /api/staff
export const createUserAPI = async (data) => {
  const response = await axiosClient.post('/api/staff', data);
  return response.data;
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
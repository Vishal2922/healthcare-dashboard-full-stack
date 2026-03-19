import axiosClient from '../../services/axiosClient';

// GET /api/users/roles
export const fetchAllRolesAPI = async () => {
  const response = await axiosClient.get('/api/users/roles');
  return response.data;
};

// GET /api/users/roles  (permissions are embedded inside roles)
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
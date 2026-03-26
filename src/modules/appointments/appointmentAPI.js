import axiosClient from '../../services/axiosClient';

export const fetchAppointmentsAPI = async (params = {}) => {
  const { page = 1, perPage = 5, ...rest } = params;
  const apiParams = { 
    page, 
    per_page: perPage, 
    ...rest 
  };
  
  const response = await axiosClient.get('/api/appointments', { params: apiParams });
  return response.data?.data ?? response.data;
};

export const bookAppointmentAPI = async (payload) => {
  const response = await axiosClient.post('/api/appointments/book', payload);
  return response.data?.data ?? response.data;
};

export const updateAppointmentStatusAPI = async (id, status) => {
  const response = await axiosClient.patch(`/api/appointments/${id}/status`, { status });
  return response.data?.data ?? response.data;
};

export const cancelAppointmentAPI = async (id) => {
  const response = await axiosClient.delete(`/api/appointments/${id}/cancel`);
  return response.data?.data ?? response.data;
};
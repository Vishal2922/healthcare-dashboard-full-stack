import axiosClient from '../../services/axiosClient';

/**
 * authAPI
 *
 * Thin layer that maps backend auth endpoints to promise-returning functions.
 * Saga / hook layer calls these — never calls axios directly.
 *
 * Backend routes (all under ResolveTenant middleware):
 *   POST /api/auth/login
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 *   GET  /api/auth/csrf-token
 *   GET  /api/auth/me
 */

export const loginAPI = async ({ username, password }) => {
  const response = await axiosClient.post('/api/auth/login', {
    username,
    password,
  });
  return response.data; // { message, data: { access_token, csrf_token, user, ... } }
};

export const refreshTokenAPI = async () => {
  // refresh_token cookie is sent automatically via withCredentials: true
  const response = await axiosClient.post('/api/auth/refresh');
  return response.data;
};

export const logoutAPI = async () => {
  const response = await axiosClient.post('/api/auth/logout');
  return response.data;
};

export const fetchCsrfTokenAPI = async () => {
  const response = await axiosClient.get('/api/auth/csrf-token');
  return response.data; // { data: { csrf_token, expires_in } }
};

export const fetchMeAPI = async () => {
  const response = await axiosClient.get('/api/auth/me');
  return response.data;
};
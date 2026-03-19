import axios from 'axios';
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

/**
 * Dedicated refresh call for the saga's proactive/session-check flow.
 * Uses a RAW axios instance (no response interceptor) so the saga
 * can handle 401 errors itself instead of the interceptor hijacking
 * with forceLogout() + window.location.href = '/login'.
 */
export const refreshTokenDirectAPI = async () => {
  const host = window.location.hostname;
  const rootDomain = process.env.REACT_APP_APP_DOMAIN || 'localhost';
  const tenantCode =
    host !== rootDomain && host.endsWith(`.${rootDomain}`)
      ? host.replace(`.${rootDomain}`, '')
      : null;

  let baseURL = process.env.REACT_APP_API_BASE_URL;
  if (baseURL) {
    try {
      const u = new URL(baseURL);
      if (u.hostname === 'localhost' && host !== 'localhost') u.hostname = host;
      baseURL = u.toString().replace(/\/$/, '');
    } catch (_) { /* keep original */ }
  } else {
    baseURL = `http://${host}/clinic_backend/public`;
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantCode)  headers['X-Tenant-ID'] = tenantCode;

  const response = await axios.post(`${baseURL}/api/auth/refresh`, null, {
    withCredentials: true,
    headers,
  });
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
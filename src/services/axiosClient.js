import axios from 'axios';
import { getStore, getIsRefreshing, setIsRefreshing } from './storeInjector';

const getBaseUrl = () => {
  let envUrl = process.env.REACT_APP_API_BASE_URL;
  if (!envUrl) {
    return `http://${window.location.hostname}/clinic_backend/public`;
  }
  try {
    const urlObj = new URL(envUrl);
    // If the frontend is on a subdomain (e.g., apollo.localhost) and the env URL is localhost, match them 
    if (urlObj.hostname === 'localhost' && window.location.hostname !== 'localhost') {
      urlObj.hostname = window.location.hostname;
    }
    // Remove trailing slash if present
    return urlObj.toString().replace(/\/$/, '');
  } catch (e) {
    return envUrl;
  }
};

const BASE_URL = getBaseUrl();

function getTenantCode() {
  const host       = window.location.hostname;
  const rootDomain = process.env.REACT_APP_APP_DOMAIN || 'localhost';

  // ── Subdomain detection (production + local subdomain dev) ────────────────
  // e.g. apollo.localhost  → 'apollo'
  // e.g. apollo.healthapp.com → 'apollo'
  if (host !== rootDomain && host.endsWith(`.${rootDomain}`)) {
    return host.replace(`.${rootDomain}`, '');
  }

  // ── Bare root domain (e.g. localhost:3000 or healthapp.com) ───────────────
  // Return null — no tenant can be determined from hostname alone.
  // The backend ResolveTenant middleware will reject with 400
  // "Missing tenant identifier" — correct behaviour for tenant isolation.
  //
  // We do NOT fall back to REACT_APP_TENANT_CODE here.
  // That fallback caused bare localhost:3000 to silently use the apollo tenant,
  // breaking tenant isolation completely.
  return null;
}

const axiosClient = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    const tenantCode = getTenantCode();
    if (tenantCode) {
      config.headers['X-Tenant-ID'] = tenantCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Reactive Silent Refresh ───────────────────────────
let pendingQueue = [];

function processQueue(error, token = null) {
  pendingQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else        prom.resolve(token);
  });
  pendingQueue = [];
}

async function forceLogout() {
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('csrf_token');

  const store = getStore();
  if (store) {
    const { logoutSuccess } = await import('../modules/auth/authSlice');
    store.dispatch(logoutSuccess());
  }

  window.location.href = '/login';
}

axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isLoginEndpoint   = url.includes('/api/auth/login');
    const isRefreshEndpoint =
      url.includes('/api/auth/refresh') ||
      url.includes('/api/settings/rotate-tokens');

    if (isLoginEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshEndpoint) {
      console.warn('[axiosClient] 401 on refresh endpoint — session expired, logging out');
      await forceLogout();
      return Promise.reject(error);
    }

    console.warn('[axiosClient] 401 on', url, '— reactive token refresh');

    if (getIsRefreshing()) {
      console.info('[axiosClient] Refresh already in progress — queuing request');
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          }
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    setIsRefreshing(true);

    try {
      const res  = await axiosClient.post('/api/auth/refresh');
      const data = res.data?.data || res.data;
      const { access_token, csrf_token, expires_in } = data;

      localStorage.setItem('access_token', access_token);
      if (csrf_token) sessionStorage.setItem('csrf_token', csrf_token);

      const store = getStore();
      if (store) {
        const { tokenRefreshed } = await import('../modules/auth/authSlice');
        store.dispatch(tokenRefreshed({ access_token, csrf_token, expires_in }));
      }

      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      processQueue(null, access_token);

      if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
        originalRequest.headers.set('Authorization', `Bearer ${access_token}`);
      } else {
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
      }
      return axiosClient(originalRequest);

    } catch (refreshError) {
      const refreshStatus = refreshError?.response?.status;
      processQueue(refreshError, null);

      if (refreshStatus === 401) {
        await forceLogout();
      }

      return Promise.reject(refreshError);

    } finally {
      setIsRefreshing(false);
    }
  }
);

export default axiosClient;
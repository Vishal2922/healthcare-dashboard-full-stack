import axios from 'axios';

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost/clinic_backend/public';

/**
 * getTenantCode()
 *
 * Backend resolves tenant via:
 *   1. Subdomain  → apollo_clinic.healthapp.com
 *   2. X-Tenant-ID header (fallback for localhost / direct API calls)
 *
 * During development on localhost, we read REACT_APP_TENANT_CODE from .env
 * or derive it from the subdomain when deployed.
 */
function getTenantCode() {
  const host = window.location.hostname;
  const rootDomain = process.env.REACT_APP_APP_DOMAIN || 'localhost';

  if (host !== rootDomain && host.endsWith(`.${rootDomain}`)) {
    return host.replace(`.${rootDomain}`, '');
  }

  // Dev fallback: read from .env
  return process.env.REACT_APP_TENANT_CODE || null;
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Required: refresh_token cookie flows automatically
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    // 1. Inject JWT access token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Inject CSRF token for state-mutating requests
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (
      csrfToken &&
      ['post', 'put', 'patch', 'delete'].includes(config.method)
    ) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // 3. Inject Tenant identifier (header fallback for non-subdomain envs)
    const tenantCode = getTenantCode();
    if (tenantCode) {
      config.headers['X-Tenant-ID'] = tenantCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
  pendingQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 → attempt token refresh (only once per request)
    // CRITICAL: Do NOT attempt refresh for login/auth endpoints, as 401 there 
    // means "Invalid Credentials" or "Session Expired", not just an expired access token.
    const isAuthUrl = originalRequest.url.includes('/api/auth');
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthUrl) {
        console.log('[axiosClient] 401 on Auth URL - skipping refresh:', originalRequest.url);
        return Promise.reject(error);
      }

      console.warn('[axiosClient] 401 Detected - Retrying:', originalRequest.url);
      
      if (isRefreshing) {
        console.log('[axiosClient] Refresh already in progress, queuing...');
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[axiosClient] Attempting token refresh...');
        const res = await axiosClient.post('/api/auth/refresh');
        // res.data is already axios-unwrapped: { status, message, data: { access_token, csrf_token } }
        const { access_token, csrf_token } = res.data?.data || res.data;

        localStorage.setItem('access_token', access_token);
        if (csrf_token) sessionStorage.setItem('csrf_token', csrf_token);

        axiosClient.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${access_token}`;
        processQueue(null, access_token);

        console.log('[axiosClient] Refresh successful, retrying original request.');
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('[axiosClient] Refresh failed, redirecting to login.');
        processQueue(refreshError, null);
        // Refresh failed → clear session, redirect to login
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('csrf_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
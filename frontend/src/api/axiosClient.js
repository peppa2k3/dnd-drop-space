import axios from 'axios';

// The access token lives only in memory (never localStorage) to limit the
// blast radius of an XSS bug - the long-lived refresh token is a separate,
// httpOnly cookie the browser sends automatically and JS can never read.
let accessToken = null;
let onSessionExpired = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** Called once by AuthProvider so this module can react to a fully-expired session. */
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // always send the httpOnly refresh cookie
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Multiple requests can 401 around the same time (e.g. a page firing 4
// queries at once after the access token expired) - this dedups them into
// a single /auth/refresh call instead of racing four refreshes.
let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const isAuthRoute = /\/auth\/(login(?:\/otp\/(?:request|verify))?|register|email\/(?:verify|resend)|password\/(?:forgot|verify|reset)|google(?:\/(?:config|link))?|refresh)$/.test(originalRequest.url || '');

    if (status !== 401 || originalRequest._retried || isAuthRoute) {
      return Promise.reject(error);
    }
    originalRequest._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', {}, { withCredentials: true })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const { data } = await refreshPromise;
      setAccessToken(data.data.accessToken);
      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${data.data.accessToken}` };
      return apiClient(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      if (onSessionExpired) onSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;

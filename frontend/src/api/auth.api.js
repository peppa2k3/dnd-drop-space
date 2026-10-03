import apiClient from './axiosClient';

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data.data),
  refresh: () => apiClient.post('/auth/refresh').then((r) => r.data.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
  resendVerification: (email) => apiClient.post('/auth/email/resend', { email }).then((r) => r.data.data),
  verifyEmail: (email, code) => apiClient.post('/auth/email/verify', { email, code }).then((r) => r.data.data),
  requestLoginOtp: (email) => apiClient.post('/auth/login/otp/request', { email }).then((r) => r.data.data),
  loginWithOtp: (email, code) => apiClient.post('/auth/login/otp/verify', { email, code }).then((r) => r.data.data),
  forgotPassword: (email) => apiClient.post('/auth/password/forgot', { email }).then((r) => r.data.data),
  verifyResetOtp: (email, code) => apiClient.post('/auth/password/verify', { email, code }).then((r) => r.data.data),
  resetPassword: (email, resetToken, password) => apiClient.post('/auth/password/reset', { email, resetToken, password }).then((r) => r.data.data),
  googleConfig: () => apiClient.get('/auth/google/config').then((r) => r.data.data),
  googleLogin: (idToken) => apiClient.post('/auth/google', { idToken }).then((r) => r.data.data),
  googleLink: (linkToken, code) => apiClient.post('/auth/google/link', { linkToken, code }).then((r) => r.data.data),
};

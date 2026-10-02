import apiClient from './axiosClient';

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data.data),
  refresh: () => apiClient.post('/auth/refresh').then((r) => r.data.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
};

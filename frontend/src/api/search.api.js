import apiClient from './axiosClient';

export const searchApi = {
  search: (q, params) => apiClient.get('/search', { params: { q, ...params } }).then((r) => r.data),
};

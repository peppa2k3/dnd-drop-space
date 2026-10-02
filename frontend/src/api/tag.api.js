import apiClient from './axiosClient';

export const tagApi = {
  list: () => apiClient.get('/tags').then((r) => r.data.data.tags),
  create: (payload) => apiClient.post('/tags', payload).then((r) => r.data.data.tag),
  update: (id, payload) => apiClient.patch(`/tags/${id}`, payload).then((r) => r.data.data.tag),
  remove: (id) => apiClient.delete(`/tags/${id}`).then((r) => r.data),
};

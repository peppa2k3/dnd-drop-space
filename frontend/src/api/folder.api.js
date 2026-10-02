import apiClient from './axiosClient';

export const folderApi = {
  list: () => apiClient.get('/folders').then((r) => r.data.data.folders),
  create: (payload) => apiClient.post('/folders', payload).then((r) => r.data.data.folder),
  update: (id, payload) => apiClient.patch(`/folders/${id}`, payload).then((r) => r.data.data.folder),
  remove: (id) => apiClient.delete(`/folders/${id}`).then((r) => r.data),
};

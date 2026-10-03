import apiClient from './axiosClient';
export const userApi = {
  update: (body) => apiClient.patch('/users/me', body).then((r) => r.data.data),
  avatar: (file) => {
    const body = new FormData();
    body.append('avatar', file);
    return apiClient.post('/users/me/avatar', body).then((r) => r.data.data);
  },
  list: (page, q) => apiClient.get('/admin/users', { params: { page, q } }).then((r) => r.data.data),
  updateUser: (id, body) => apiClient.patch(`/admin/users/${id}`, body).then((r) => r.data.data),
  files: (id, page) => apiClient.get(`/admin/users/${id}/files`, { params: { page } }).then((r) => r.data.data),
  fileAction: (id, itemId, isTrashed) => apiClient.patch(`/admin/users/${id}/files/${itemId}`, { isTrashed }).then((r) => r.data.data),
  deleteFile: (id, itemId) => apiClient.delete(`/admin/users/${id}/files/${itemId}`).then((r) => r.data.data),
  audit: (id, page) => apiClient.get(`/admin/users/${id}/audit`, { params: { page } }).then((r) => r.data.data),
};

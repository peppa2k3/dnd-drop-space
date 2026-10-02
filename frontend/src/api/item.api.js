import apiClient from './axiosClient';

export const itemApi = {
  list: (params) => apiClient.get('/items', { params }).then((r) => r.data),
  getOne: (id) => apiClient.get(`/items/${id}`).then((r) => r.data.data.item),

  createNote: (payload) => apiClient.post('/items/note', payload).then((r) => r.data.data.item),
  updateNoteContent: (id, content) =>
    apiClient.patch(`/items/${id}/note`, { content }).then((r) => r.data.data.item),

  createUrl: (payload) => apiClient.post('/items/url', payload).then((r) => r.data.data.item),

  update: (id, payload) => apiClient.patch(`/items/${id}`, payload).then((r) => r.data.data.item),
  toggleFavorite: (id) => apiClient.patch(`/items/${id}/favorite`).then((r) => r.data.data.item),

  upload: (formData, onUploadProgress) =>
    apiClient
      .post('/items/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      })
      .then((r) => r.data.data.items),

  moveToTrash: (id) => apiClient.delete(`/items/${id}`).then((r) => r.data),
  restore: (id) => apiClient.post(`/items/${id}/restore`).then((r) => r.data.data.item),
  permanentlyDelete: (id) => apiClient.delete(`/items/${id}/permanent`).then((r) => r.data),
};

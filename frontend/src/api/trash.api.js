import apiClient from './axiosClient';

export const trashApi = {
  list: (params) => apiClient.get('/trash', { params }).then((r) => r.data),
  empty: () => apiClient.delete('/trash').then((r) => r.data.data),
};

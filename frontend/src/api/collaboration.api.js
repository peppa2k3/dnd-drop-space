import api from './axiosClient';
const data = (response) => response.data.data;
export const socialApi = {
  search: (q) => api.get('/social/users', { params: { q } }).then(data),
  friends: () => api.get('/social/friends').then(data),
  requests: () => api.get('/social/requests').then(data),
  blocks: () => api.get('/social/blocks').then(data),
  request: (userId) => api.post('/social/friends/requests', { userId }).then(data),
  decide: (id, action) => api.patch(`/social/friends/requests/${id}`, { action }).then(data),
  unfriend: (userId) => api.delete(`/social/friends/${userId}`).then(data),
  block: (userId) => api.post(`/social/blocks/${userId}`).then(data),
  unblock: (userId) => api.delete(`/social/blocks/${userId}`).then(data),
};
export const groupApi = {
  mine: () => api.get('/groups').then(data),
  search: (q) => api.get('/groups/search', { params: { q } }).then(data),
  invitations: () => api.get('/groups/invitations').then(data),
  decide: (id, action) => api.patch(`/groups/invitations/${id}`, { action }).then(data),
  create: (body) => api.post('/groups', body).then(data),
  update: (id, body) => api.patch(`/groups/${id}`, body).then(data),
  remove: (id) => api.delete(`/groups/${id}`).then(data),
  invite: (id, userId) => api.post(`/groups/${id}/invitations`, { userId }).then(data),
  transferOwner: (id, userId) => api.patch(`/groups/${id}/owner`, { userId }).then(data),
  member: (id, userId, role) => role
    ? api.patch(`/groups/${id}/members/${userId}`, { role }).then(data)
    : api.delete(`/groups/${id}/members/${userId}`).then(data),
};
export const shareApi = {
  received: (cursor) => api.get('/shares/received', { params: cursor ? { cursor } : {} }).then(data),
  outgoing: () => api.get('/shares/outgoing').then(data),
  item: (itemId) => api.get(`/shares/item/${itemId}`).then(data),
  create: (body) => api.post('/shares', body).then(data),
  update: (id, body) => api.patch(`/shares/${id}`, body).then(data),
  revoke: (id) => api.delete(`/shares/${id}`).then(data),
  unlock: (id, password) => api.post(`/shares/${id}/unlock`, { password }).then(data),
};
export const adminCollaborationApi = {
  list: (kind, page) => api.get(`/admin/collaboration/${kind}`, { params: { page } }).then(data),
  remove: (kind, id) => api.delete(`/admin/collaboration/${kind}/${id}`).then(data),
  updateGroup: (id, body) => api.patch(`/admin/collaboration/groups/${id}`, body).then(data),
  member: (id, userId, role) => role
    ? api.patch(`/admin/collaboration/groups/${id}/members/${userId}`, { role }).then(data)
    : api.delete(`/admin/collaboration/groups/${id}/members/${userId}`).then(data),
};

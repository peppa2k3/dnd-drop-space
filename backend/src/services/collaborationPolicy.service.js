const UserBlock = require('../models/UserBlock');
const ApiError = require('../utils/ApiError');

const SYSTEM = {
  'friend.use': () => true,
  'group.create': (user) => user.storageLimitBytes > 0,
  'group.manage': () => false, // group role checked against membership in the controller
  'file.share': (user) => user.storageLimitBytes > 0,
  'file.reshare': (user) => user.storageLimitBytes > 0, // live canReshare checked separately
  'admin.friend.read': (user) => user.role === 'admin',
  'admin.group.read': (user) => user.role === 'admin',
  'admin.group.manage': (user) => user.role === 'admin',
  'admin.share.read': (user) => user.role === 'admin',
  'admin.share.revoke': (user) => user.role === 'admin',
};
function requirePermission(user, permission) {
  if (user.status !== 'active' || !SYSTEM[permission]?.(user)) {
    throw ApiError.forbidden('Permission denied');
  }
}
async function blockedBetween(a, b) {
  return UserBlock.exists({ $or: [
    { blocker: a, blocked: b }, { blocker: b, blocked: a },
  ] });
}
function publicUser(user) {
  return {
    id: user._id, username: user.username, name: user.name,
    avatarUrl: user.avatarObjectKey ? `/api/users/${user._id}/avatar?v=${user.updatedAt.getTime()}` : null,
  };
}
module.exports = { requirePermission, blockedBetween, publicUser };

const mongoose = require('mongoose');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const UserBlock = require('../models/UserBlock');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const policy = require('../services/collaborationPolicy.service');

const key = (a, b) => [String(a), String(b)].sort().join(':');
async function visibleUser(self, id) {
  if (String(self) === String(id)) throw ApiError.badRequest('Choose another user');
  const user = await User.findOne({ _id: id, status: 'active' });
  if (!user || await policy.blockedBetween(self, id)) throw ApiError.notFound('User not found');
  return user;
}
async function listPeople(ids, self) {
  const blocked = await UserBlock.find({ $or: [{ blocker: self }, { blocked: self }] }).select('blocker blocked').lean();
  const hidden = new Set(blocked.flatMap((row) => [String(row.blocker), String(row.blocked)]));
  hidden.delete(String(self));
  const users = await User.find({ _id: { $in: ids.filter((id) => !hidden.has(String(id))) }, status: 'active' });
  return new Map(users.map((user) => [String(user._id), policy.publicUser(user)]));
}
const search = asyncHandler(async (req, res) => {
  const q = req.query.q.toLowerCase();
  if (!q) return new ApiResponse(200, { users: [] }).send(res);
  const filter = mongoose.isValidObjectId(q) ? { $or: [{ _id: q }, { username: q }] } : { username: { $regex: '^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } };
  const users = await User.find({ ...filter, status: 'active', _id: { $ne: req.userId } }).limit(30);
  const visible = await listPeople(users.map((user) => user._id), req.userId);
  return new ApiResponse(200, { users: users.map((user) => visible.get(String(user._id))).filter(Boolean).slice(0, 20) }).send(res);
});
const listFriends = asyncHandler(async (req, res) => {
  const relations = await Friendship.find({ users: req.userId, status: 'accepted' }).sort({ updatedAt: -1 }).limit(500);
  const ids = relations.map((relation) => relation.users.find((id) => String(id) !== req.userId));
  const visible = await listPeople(ids, req.userId);
  return new ApiResponse(200, { friends: ids.map((id) => visible.get(String(id))).filter(Boolean) }).send(res);
});
const listRequests = asyncHandler(async (req, res) => {
  const relations = await Friendship.find({ users: req.userId, status: 'pending' }).sort({ createdAt: -1 }).limit(200);
  const ids = relations.map((relation) => relation.users.find((id) => String(id) !== req.userId));
  const visible = await listPeople(ids, req.userId);
  return new ApiResponse(200, { requests: relations.map((relation, i) => ({
    id: relation._id, direction: String(relation.requester) === req.userId ? 'outgoing' : 'incoming',
    user: visible.get(String(ids[i])),
  })).filter((relation) => relation.user) }).send(res);
});
const requestFriend = asyncHandler(async (req, res) => {
  const other = await visibleUser(req.userId, req.body.userId);
  const pairKey = key(req.userId, other._id);
  if (await Friendship.exists({ pairKey })) throw ApiError.conflict('Friendship or request already exists');
  if (await Friendship.countDocuments({ users: req.userId }) >= 500) throw ApiError.badRequest('Friend limit reached');
  const relation = await Friendship.create({ pairKey, users: pairKey.split(':'), requester: req.userId });
  return new ApiResponse(201, { id: relation._id }, 'Friend request sent').send(res);
});
const decideRequest = asyncHandler(async (req, res) => {
  const relation = await Friendship.findOne({ _id: req.params.id, status: 'pending', users: req.userId });
  if (!relation) throw ApiError.notFound('Request not found');
  const sender = String(relation.requester);
  if (req.body.action === 'cancel') {
    if (sender !== req.userId) throw ApiError.forbidden();
    await relation.deleteOne();
  } else {
    if (sender === req.userId) throw ApiError.forbidden();
    if (req.body.action === 'accept') {
      await visibleUser(req.userId, sender);
      relation.status = 'accepted';
      await relation.save();
    } else await relation.deleteOne();
  }
  return new ApiResponse(200, null, 'Request updated').send(res);
});
const unfriend = asyncHandler(async (req, res) => {
  const result = await Friendship.deleteOne({ pairKey: key(req.userId, req.params.userId), status: 'accepted' });
  if (!result.deletedCount) throw ApiError.notFound('Friend not found');
  return new ApiResponse(200, null, 'Friend removed').send(res);
});
const blocks = asyncHandler(async (req, res) => {
  const rows = await UserBlock.find({ blocker: req.userId }).sort({ createdAt: -1 }).limit(500);
  const users = await User.find({ _id: { $in: rows.map((row) => row.blocked) } });
  return new ApiResponse(200, { users: users.map(policy.publicUser) }).send(res);
});
const block = asyncHandler(async (req, res) => {
  if (req.params.userId === req.userId) throw ApiError.badRequest('Cannot block yourself');
  if (!await User.exists({ _id: req.params.userId })) throw ApiError.notFound('User not found');
  await UserBlock.updateOne({ blocker: req.userId, blocked: req.params.userId },
    { $setOnInsert: { blocker: req.userId, blocked: req.params.userId } }, { upsert: true });
  await Friendship.deleteOne({ pairKey: key(req.userId, req.params.userId) });
  // Direct shares cannot silently return when the block is lifted.
  const FileShare = require('../models/FileShare');
  const { revokeTree } = require('../services/share.service');
  const rows = await FileShare.find({ owner: req.userId, targetType: 'user', target: req.params.userId });
  for (const share of rows) await revokeTree(share._id);
  return new ApiResponse(200, null, 'User blocked').send(res);
});
const unblock = asyncHandler(async (req, res) => {
  await UserBlock.deleteOne({ blocker: req.userId, blocked: req.params.userId });
  return new ApiResponse(200, null, 'User unblocked').send(res);
});
module.exports = { search, listFriends, listRequests, requestFriend, decideRequest, unfriend, blocks, block, unblock };

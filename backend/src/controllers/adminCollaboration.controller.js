const mongoose = require('mongoose');
const Friendship = require('../models/Friendship');
const UserGroup = require('../models/UserGroup');
const GroupInvitation = require('../models/GroupInvitation');
const FileShare = require('../models/FileShare');
const Item = require('../models/Item');
const AdminAudit = require('../models/AdminAudit');
const { revokeTree, publicShare } = require('../services/share.service');
const { withGroup } = require('./group.controller');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const page = (req) => Math.min(1000, Math.max(1, Number(req.query.page) || 1));
const listFriends = asyncHandler(async (req, res) => {
  const current = page(req);
  const [rows, total] = await Promise.all([
    Friendship.find().sort({ createdAt: -1 }).skip((current - 1) * 20).limit(20).lean(),
    Friendship.countDocuments(),
  ]);
  return new ApiResponse(200, { rows, total, page: current }).send(res);
});
const removeFriend = asyncHandler(async (req, res) => {
  const relation = await Friendship.findByIdAndDelete(req.params.id);
  if (!relation) throw ApiError.notFound('Friendship not found');
  await AdminAudit.create({ actor: req.userId, target: relation.requester, action: 'moderate-friend', changes: { relationshipId: relation._id } });
  return new ApiResponse(200, null, 'Relationship removed').send(res);
});
const listGroups = asyncHandler(async (req, res) => {
  const current = page(req);
  const [rows, total] = await Promise.all([
    UserGroup.find().sort({ createdAt: -1 }).skip((current - 1) * 20).limit(20).lean(),
    UserGroup.countDocuments(),
  ]);
  return new ApiResponse(200, { rows, total, page: current }).send(res);
});
const updateGroup = asyncHandler(async (req, res) => {
  const group = await withGroup(req.params.id, async () => {
    const found = await UserGroup.findById(req.params.id);
    if (!found) throw ApiError.notFound('Group not found');
    Object.assign(found, req.body);
    await found.save();
    await AdminAudit.create({ actor: req.userId, target: found.owner, action: 'moderate-group', changes: { groupId: found._id, fields: Object.keys(req.body) } });
    return found;
  });
  return new ApiResponse(200, { group }).send(res);
});
const member = asyncHandler(async (req, res) => {
  await withGroup(req.params.id, async () => {
    const group = await UserGroup.findById(req.params.id);
    if (!group) throw ApiError.notFound('Group not found');
    const current = group.members.find((row) => String(row.user) === req.params.userId);
    if (!current) throw ApiError.notFound('Member not found');
    if (current.role === 'OWNER') throw ApiError.forbidden('Cannot remove the group owner');
    if (req.method === 'DELETE') {
      await UserGroup.updateOne({ _id: group._id },
        { $pull: { members: { user: new mongoose.Types.ObjectId(req.params.userId) } } });
    } else {
      await UserGroup.updateOne({ _id: group._id, 'members.user': req.params.userId },
        { $set: { 'members.$.role': req.body.role } });
    }
    await AdminAudit.create({ actor: req.userId, target: group.owner, action: 'moderate-group-member',
      changes: { groupId: group._id, memberId: req.params.userId, action: req.method, role: req.body.role } });
  });
  return new ApiResponse(200, null, 'Member updated').send(res);
});
const removeGroup = asyncHandler(async (req, res) => {
  await withGroup(req.params.id, async () => {
    const group = await UserGroup.findById(req.params.id);
    if (!group) throw ApiError.notFound('Group not found');
    const rows = await FileShare.find({ targetType: 'group', target: group._id });
    for (const row of rows) await revokeTree(row._id);
    await GroupInvitation.deleteMany({ group: group._id });
    await UserGroup.deleteOne({ _id: group._id });
    await AdminAudit.create({ actor: req.userId, target: group.owner, action: 'delete-group', changes: { groupId: group._id } });
  });
  return new ApiResponse(200, null, 'Group deleted').send(res);
});
const listShares = asyncHandler(async (req, res) => {
  const current = page(req);
  const [rows, total] = await Promise.all([
    FileShare.find().select('+passwordHash').sort({ createdAt: -1 }).skip((current - 1) * 20).limit(20),
    FileShare.countDocuments(),
  ]);
  const result = await Promise.all(rows.map(async (row) =>
    publicShare(row, await Item.findById(row.item))));
  return new ApiResponse(200, { rows: result, total, page: current }).send(res);
});
const removeShare = asyncHandler(async (req, res) => {
  const share = await FileShare.findById(req.params.id);
  if (!share) throw ApiError.notFound('Share not found');
  await revokeTree(share._id);
  await AdminAudit.create({ actor: req.userId, target: share.owner, action: 'moderate-share', changes: { shareId: share._id } });
  return new ApiResponse(200, null, 'Share revoked').send(res);
});
module.exports = { listFriends, removeFriend, listGroups, updateGroup, member, removeGroup, listShares, removeShare };

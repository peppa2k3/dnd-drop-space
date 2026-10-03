const mongoose = require('mongoose');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const GroupInvitation = require('../models/GroupInvitation');
const UserBlock = require('../models/UserBlock');
const FileShare = require('../models/FileShare');
const storage = require('../services/storage.service');
const policy = require('../services/collaborationPolicy.service');
const { revokeTree } = require('../services/share.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const withGroup = (id, action) => storage.withUserUploadLock(`group:${id}`, action);
function memberRole(group, userId) {
  return group.members.find((row) => String(row.user) === String(userId))?.role;
}
function requireMember(group, userId) {
  const role = memberRole(group, userId);
  if (!role) throw ApiError.notFound('Group not found');
  return role;
}
async function groupFor(id) {
  const group = await UserGroup.findById(id);
  if (!group) throw ApiError.notFound('Group not found');
  return group;
}
async function safeGroup(group, viewer) {
  const role = memberRole(group, viewer);
  const blocked = await UserBlock.find({ $or: [{ blocker: viewer }, { blocked: viewer }] }).select('blocker blocked').lean();
  const hidden = new Set(blocked.flatMap((row) => [String(row.blocker), String(row.blocked)]));
  hidden.delete(String(viewer));
  const ids = group.members.map((m) => m.user).filter((id) => !hidden.has(String(id)));
  const people = await User.find({ _id: { $in: ids }, status: 'active' });
  const names = new Map(people.map((u) => [String(u._id), policy.publicUser(u)]));
  return {
    id: group._id, name: group.name, description: group.description,
    discoverable: group.discoverable, memberCount: group.members.length,
    role, members: role ? group.members.map((m) => ({
      ...names.get(String(m.user)), role: m.role,
    })).filter((m) => m.id) : undefined,
  };
}
const mine = asyncHandler(async (req, res) => {
  const groups = await UserGroup.find({ 'members.user': req.userId }).sort({ updatedAt: -1 }).limit(50);
  return new ApiResponse(200, { groups: await Promise.all(groups.map((g) => safeGroup(g, req.userId))) }).send(res);
});
const search = asyncHandler(async (req, res) => {
  const q = req.query.q;
  if (!q) return new ApiResponse(200, { groups: [] }).send(res);
  const filter = /^[a-f\d]{24}$/i.test(q) ? { $or: [{ _id: q }, { name: { $regex: '^' + q } }] } :
    { name: { $regex: '^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } };
  const groups = await UserGroup.find({ ...filter, discoverable: true }).limit(25);
  const filtered = [];
  for (const group of groups) {
    if (!await policy.blockedBetween(group.owner, req.userId)) filtered.push(await safeGroup(group, req.userId));
  }
  return new ApiResponse(200, { groups: filtered.slice(0, 20) }).send(res);
});
const create = asyncHandler(async (req, res) => {
  policy.requirePermission(req.user, 'group.create');
  if (await UserGroup.countDocuments({ 'members.user': req.userId }) >= 50) throw ApiError.badRequest('Group limit reached');
  const group = await UserGroup.create({ ...req.body, owner: req.userId, members: [{ user: req.userId, role: 'OWNER' }] });
  return new ApiResponse(201, { group: await safeGroup(group, req.userId) }).send(res);
});
const one = asyncHandler(async (req, res) => {
  const group = await groupFor(req.params.id);
  requireMember(group, req.userId);
  return new ApiResponse(200, { group: await safeGroup(group, req.userId) }).send(res);
});
const update = asyncHandler(async (req, res) => {
  const group = await withGroup(req.params.id, async () => {
    const found = await groupFor(req.params.id);
    if (memberRole(found, req.userId) !== 'OWNER') throw ApiError.forbidden('Group owner required');
    Object.assign(found, req.body);
    await found.save();
    return found;
  });
  return new ApiResponse(200, { group: await safeGroup(group, req.userId) }).send(res);
});
const invite = asyncHandler(async (req, res) => {
  const invitation = await withGroup(req.params.id, async () => {
    const group = await groupFor(req.params.id);
    if (!['OWNER', 'ADMIN'].includes(memberRole(group, req.userId))) throw ApiError.forbidden('Group manager required');
    if (group.members.length >= 100) throw ApiError.badRequest('Group is full');
    const targetId = req.body.userId;
    if (memberRole(group, targetId)) throw ApiError.conflict('Already a member');
    if (!await User.exists({ _id: targetId, status: 'active' }) ||
      await policy.blockedBetween(req.userId, targetId) ||
      await policy.blockedBetween(group.owner, targetId)) throw ApiError.notFound('User not found');
    const current = await GroupInvitation.findOne({ group: group._id, target: targetId });
    if (current?.status === 'pending') throw ApiError.conflict('Invitation already pending');
    if (await GroupInvitation.countDocuments({ group: group._id, status: 'pending' }) >= 100) {
      throw ApiError.badRequest('Too many pending invitations');
    }
    return GroupInvitation.findOneAndUpdate({ group: group._id, target: targetId },
      { $set: { inviter: req.userId, status: 'pending' } }, { upsert: true, new: true });
  });
  return new ApiResponse(201, { id: invitation._id }).send(res);
});
const invitations = asyncHandler(async (req, res) => {
  const rows = await GroupInvitation.find({ target: req.userId, status: 'pending' })
    .sort({ createdAt: -1 }).limit(100).populate('group', 'name owner');
  const visible = [];
  for (const inviteRow of rows) {
    if (inviteRow.group && !await policy.blockedBetween(inviteRow.group.owner, req.userId)) {
      visible.push({ id: inviteRow._id, groupId: inviteRow.group._id, groupName: inviteRow.group.name });
    }
  }
  return new ApiResponse(200, { invitations: visible }).send(res);
});
const decide = asyncHandler(async (req, res) => {
  const invitation = await GroupInvitation.findOne({ _id: req.params.id, target: req.userId, status: 'pending' });
  if (!invitation) throw ApiError.notFound('Invitation not found');
  await withGroup(String(invitation.group), async () => {
    const current = await GroupInvitation.findOne({ _id: invitation._id, target: req.userId, status: 'pending' });
    if (!current) throw ApiError.notFound('Invitation not found');
    const group = await groupFor(current.group);
    if (req.body.action === 'accept') {
      if (await policy.blockedBetween(group.owner, req.userId) ||
        await policy.blockedBetween(current.inviter, req.userId)) throw ApiError.forbidden('Invitation unavailable');
      if (group.members.length >= 100) throw ApiError.badRequest('Group is full');
      if (await UserGroup.countDocuments({ 'members.user': req.userId }) >= 50) throw ApiError.badRequest('Group limit reached');
      if (!memberRole(group, req.userId)) {
        await UserGroup.updateOne({ _id: group._id, 'members.user': { $ne: req.userId } },
          { $push: { members: { user: req.userId, role: 'MEMBER' } } });
      }
    }
    await GroupInvitation.deleteOne({ _id: current._id });
  });
  return new ApiResponse(200, null, 'Invitation updated').send(res);
});
const memberAction = asyncHandler(async (req, res) => {
  await withGroup(req.params.id, async () => {
    const group = await groupFor(req.params.id);
    const actorRole = requireMember(group, req.userId);
    const targetRole = memberRole(group, req.params.userId);
    if (!targetRole) throw ApiError.notFound('Member not found');
    if (targetRole === 'OWNER') throw ApiError.forbidden('Owner cannot be removed or demoted');
    if (req.method === 'DELETE') {
      if (req.params.userId !== req.userId &&
        !(actorRole === 'OWNER' || (actorRole === 'ADMIN' && targetRole === 'MEMBER'))) throw ApiError.forbidden();
      await UserGroup.updateOne({ _id: group._id }, { $pull: { members: { user: new mongoose.Types.ObjectId(req.params.userId) } } });
    } else {
      if (actorRole !== 'OWNER') throw ApiError.forbidden('Owner required');
      await UserGroup.updateOne({ _id: group._id, 'members.user': req.params.userId },
        { $set: { 'members.$.role': req.body.role } });
    }
  });
  return new ApiResponse(200, null, 'Member updated').send(res);
});
const transferOwner = asyncHandler(async (req, res) => {
  const group = await withGroup(req.params.id, async () => {
    const found = await groupFor(req.params.id);
    if (memberRole(found, req.userId) !== 'OWNER') throw ApiError.forbidden('Owner required');
    const nextOwner = found.members.find((row) => String(row.user) === req.body.userId);
    if (!nextOwner || nextOwner.role === 'OWNER') throw ApiError.badRequest('Choose another group member');
    if (!await User.exists({ _id: nextOwner.user, status: 'active' })) throw ApiError.badRequest('Member is unavailable');
    found.members.find((row) => String(row.user) === String(req.userId)).role = 'ADMIN';
    nextOwner.role = 'OWNER';
    found.owner = nextOwner.user;
    await found.save();
    return found;
  });
  return new ApiResponse(200, { group: await safeGroup(group, req.userId) }).send(res);
});
const remove = asyncHandler(async (req, res) => {
  await withGroup(req.params.id, async () => {
    const group = await groupFor(req.params.id);
    if (memberRole(group, req.userId) !== 'OWNER') throw ApiError.forbidden('Owner required');
    const shares = await FileShare.find({ targetType: 'group', target: group._id });
    for (const share of shares) await revokeTree(share._id);
    await GroupInvitation.deleteMany({ group: group._id });
    await UserGroup.deleteOne({ _id: group._id });
  });
  return new ApiResponse(200, null, 'Group deleted').send(res);
});
module.exports = { mine, search, create, one, update, invite, invitations, decide, memberAction, remove,
  transferOwner, safeGroup, memberRole, withGroup };

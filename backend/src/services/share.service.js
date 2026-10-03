const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Item = require('../models/Item');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const FileShare = require('../models/FileShare');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const policy = require('./collaborationPolicy.service');

const asId = (value) => String(value);
const active = (share) => !share.expiresAt || share.expiresAt.getTime() > Date.now();
async function isTarget(share, userId) {
  if (share.targetType === 'user') return asId(share.target) === asId(userId);
  return Boolean(await UserGroup.exists({ _id: share.target, 'members.user': userId }));
}
async function chainFor(share, userId) {
  const item = await Item.findOne({ _id: share.item, type: 'file', isTrashed: false });
  if (!item || asId(item.user) !== asId(share.owner)) throw ApiError.notFound('Shared file not found');
  if (!await User.exists({ _id: share.owner, status: 'active' }) ||
      !await User.exists({ _id: share.createdBy, status: 'active' }) ||
      await policy.blockedBetween(share.owner, userId) ||
      await policy.blockedBetween(share.createdBy, userId)) throw ApiError.notFound('Shared file not found');
  if (!await isTarget(share, userId)) throw ApiError.forbidden('Share is not available to you');
  const chain = [share];
  let child = share;
  for (let depth = 0; child.parentShare; depth++) {
    if (depth >= 10) throw ApiError.forbidden('Share chain is too deep');
    const parent = await FileShare.findById(child.parentShare).select('+passwordHash');
    if (!parent || !active(parent) || !parent.canReshare ||
        asId(parent.item) !== asId(item._id) || asId(parent.owner) !== asId(item.user) ||
        !await User.exists({ _id: parent.createdBy, status: 'active' }) ||
        !await isTarget(parent, child.createdBy) ||
        await policy.blockedBetween(parent.owner, child.createdBy) ||
        await policy.blockedBetween(parent.createdBy, child.createdBy)) {
      throw ApiError.forbidden('Parent share is no longer valid');
    }
    if ((child.canView && !parent.canView) ||
        (child.canDownload && !parent.canDownload) ||
        (child.canReshare && !parent.canReshare)) throw ApiError.forbidden('Parent permission revoked');
    if (parent.expiresAt && (!child.expiresAt || child.expiresAt > parent.expiresAt)) {
      throw ApiError.forbidden('Parent share expired or was shortened');
    }
    chain.push(parent);
    child = parent;
  }
  if (asId(child.createdBy) !== asId(item.user) || !active(share)) {
    throw ApiError.forbidden('Share expired or its owner has changed');
  }
  return { item, chain };
}
async function resolveShare(id, userId, { password, unlockToken, ignorePassword = false } = {}) {
  const share = await FileShare.findById(id).select('+passwordHash');
  if (!share) throw ApiError.notFound('Share not found');
  const { item, chain } = await chainFor(share, userId);
  const protectedChain = chain.filter((row) => row.passwordHash);
  if (protectedChain.length && !ignorePassword) {
    let valid = false;
    if (unlockToken) {
      try {
        const proof = jwt.verify(unlockToken, env.jwt.accessSecret);
        valid = proof.kind === 'share-unlock' && proof.sub === asId(userId) &&
          proof.share === asId(share._id) &&
          proof.version === chain.map((row) => `${row._id}:${row.updatedAt.getTime()}`).join(',');
      } catch { valid = false; }
    }
    if (!valid && password) {
      valid = (await Promise.all(protectedChain.map((row) =>
        bcrypt.compare(password, row.passwordHash)))).every(Boolean);
    }
    if (!valid) throw ApiError.forbidden('Share password required or incorrect');
  }
  return { share, item, chain, passwordProtected: protectedChain.length > 0 };
}
function issueUnlock(userId, share, chain) {
  return jwt.sign({
    kind: 'share-unlock', sub: asId(userId), share: asId(share._id),
    version: chain.map((row) => `${row._id}:${row.updatedAt.getTime()}`).join(','),
  }, env.jwt.accessSecret, { expiresIn: '5m' });
}
async function revokeTree(id) {
  const toDelete = [id];
  for (let start = 0; start < toDelete.length; start++) {
    const children = await FileShare.find({ parentShare: toDelete[start] }).select('_id');
    toDelete.push(...children.map((row) => row._id));
    if (toDelete.length > 500) throw ApiError.internal('Share tree exceeds safe limit');
  }
  await FileShare.deleteMany({ _id: { $in: toDelete } });
}
function publicShare(share, item, owner) {
  return {
    id: share._id, itemId: share.item, item: item ? {
      title: item.title, size: item.fileMeta.size, category: item.fileMeta.category,
      mimeType: item.fileMeta.mimeType,
    } : null,
    owner: owner ? policy.publicUser(owner) : undefined,
    targetType: share.targetType, targetId: share.target, createdBy: share.createdBy,
    parentShare: share.parentShare,
    canView: share.canView, canDownload: share.canDownload, canReshare: share.canReshare,
    passwordProtected: Boolean(share.passwordHash), expiresAt: share.expiresAt,
    createdAt: share.createdAt,
  };
}
module.exports = { resolveShare, issueUnlock, revokeTree, publicShare, isTarget, active };

const bcrypt = require('bcryptjs');
const FileShare = require('../models/FileShare');
const Item = require('../models/Item');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const minio = require('../services/minio.service');
const policy = require('../services/collaborationPolicy.service');
const shares = require('../services/share.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

async function targetFor(targetType, targetId, actor, owner) {
  if (targetType === 'user') {
    if (String(targetId) === String(owner) || String(targetId) === String(actor) ||
        !await User.exists({ _id: targetId, status: 'active' }) ||
        await policy.blockedBetween(owner, targetId) ||
        await policy.blockedBetween(actor, targetId)) throw ApiError.notFound('Recipient not found');
  } else if (!await UserGroup.exists({ _id: targetId, 'members.user': actor })) {
    throw ApiError.notFound('Group not found');
  }
}
const create = asyncHandler(async (req, res) => {
  const body = req.body;
  const item = await Item.findOne({ _id: body.itemId, type: 'file', isTrashed: false });
  if (!item) throw ApiError.notFound('File not found');
  let source = null;
  if (String(item.user) === req.userId) {
    policy.requirePermission(req.user, 'file.share');
    if (body.sourceShareId) throw ApiError.badRequest('Owner must create a direct share');
  } else {
    policy.requirePermission(req.user, 'file.reshare');
    if (!body.sourceShareId) throw ApiError.forbidden('A valid source share is required');
    const access = await shares.resolveShare(body.sourceShareId, req.userId, { password: body.sourcePassword });
    if (String(access.item._id) !== String(item._id) || !access.share.canReshare) throw ApiError.forbidden('Resharing is not allowed');
    source = access.share;
    if ((body.canView && !source.canView) || (body.canDownload && !source.canDownload) ||
        (body.canReshare && !source.canReshare)) throw ApiError.forbidden('Cannot grant rights you do not have');
    if (source.passwordHash && body.password) throw ApiError.badRequest('Password is inherited from the source share');
  }
  await targetFor(body.targetType, body.targetId, req.userId, item.user);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : source?.expiresAt || null;
  if (expiresAt && (expiresAt.getTime() <= Date.now() ||
      (source?.expiresAt && expiresAt > source.expiresAt))) throw ApiError.badRequest('Invalid expiration');
  if (await FileShare.countDocuments({ item: item._id }) >= 100) throw ApiError.badRequest('Share limit reached');
  const passwordHash = source?.passwordHash || (body.password ? await bcrypt.hash(body.password, 10) : null);
  const share = await FileShare.create({
    item: item._id, owner: item.user, createdBy: req.userId,
    parentShare: source?._id || null, targetType: body.targetType, target: body.targetId,
    canView: body.canView, canDownload: body.canDownload, canReshare: body.canReshare,
    passwordHash, expiresAt,
  });
  return new ApiResponse(201, { share: shares.publicShare(share, item) }).send(res);
});
const update = asyncHandler(async (req, res) => {
  const share = await FileShare.findById(req.params.id).select('+passwordHash');
  if (!share) throw ApiError.notFound('Share not found');
  if (String(share.owner) !== req.userId && String(share.createdBy) !== req.userId) throw ApiError.forbidden();
  if (String(share.createdBy) === req.userId && String(share.owner) !== req.userId) {
    await shares.resolveShare(share.parentShare, req.userId, { ignorePassword: true });
  }
  if (share.parentShare) {
    const parent = await FileShare.findById(share.parentShare).select('+passwordHash');
    if (!parent || !parent.canReshare) throw ApiError.forbidden('Parent share revoked');
    for (const right of ['canView', 'canDownload', 'canReshare']) {
      if (req.body[right] && !parent[right]) throw ApiError.forbidden('Cannot grant rights you do not have');
    }
    if (req.body.password !== undefined) throw ApiError.badRequest('Password is inherited');
    if (parent.expiresAt && (req.body.expiresAt === null || (req.body.expiresAt &&
      new Date(req.body.expiresAt) > parent.expiresAt))) throw ApiError.badRequest('Expiration cannot exceed parent');
  }
  if (req.body.expiresAt && new Date(req.body.expiresAt) <= new Date()) throw ApiError.badRequest('Invalid expiration');
  if (req.body.password !== undefined) {
    // A changed password invalidates all downstream shares and proof tokens.
    const children = await FileShare.find({ parentShare: share._id }).select('_id');
    for (const child of children) await shares.revokeTree(child._id);
    share.passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 10) : null;
  }
  for (const right of ['canView', 'canDownload', 'canReshare']) {
    if (req.body[right] !== undefined) share[right] = req.body[right];
  }
  if (!share.canView && !share.canDownload && !share.canReshare) throw ApiError.badRequest('Choose at least one permission');
  if (req.body.expiresAt !== undefined) share.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
  await share.save();
  return new ApiResponse(200, { share: shares.publicShare(share) }).send(res);
});
const revoke = asyncHandler(async (req, res) => {
  const share = await FileShare.findById(req.params.id);
  if (!share) throw ApiError.notFound('Share not found');
  if (String(share.owner) !== req.userId && String(share.createdBy) !== req.userId) throw ApiError.forbidden();
  await shares.revokeTree(share._id);
  return new ApiResponse(200, null, 'Share revoked').send(res);
});
async function decorate(share) {
  const [item, owner] = await Promise.all([Item.findById(share.item), User.findById(share.owner)]);
  return shares.publicShare(share, item, owner);
}
const outgoing = asyncHandler(async (req, res) => {
  const rows = await FileShare.find({ createdBy: req.userId }).select('+passwordHash').sort({ _id: -1 }).limit(100);
  return new ApiResponse(200, { shares: await Promise.all(rows.map(decorate)) }).send(res);
});
const forItem = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.itemId, user: req.userId, type: 'file' });
  if (!item) throw ApiError.notFound('File not found');
  const rows = await FileShare.find({ item: item._id }).select('+passwordHash').sort({ createdAt: -1 }).limit(100);
  return new ApiResponse(200, { shares: await Promise.all(rows.map(decorate)) }).send(res);
});
const received = asyncHandler(async (req, res) => {
  const groups = await UserGroup.find({ 'members.user': req.userId }).select('_id');
  const targets = [{ targetType: 'user', target: req.userId }];
  if (groups.length) targets.push({ targetType: 'group', target: { $in: groups.map((g) => g._id) } });
  const filter = { $or: targets, ...(req.query.cursor ? { _id: { $lt: req.query.cursor } } : {}) };
  const rows = await FileShare.find(filter).select('+passwordHash').sort({ _id: -1 }).limit(21);
  const result = [];
  for (const row of rows.slice(0, 20)) {
    if (String(row.owner) === req.userId) continue;
    try {
      await shares.resolveShare(row._id, req.userId, { ignorePassword: true });
      result.push(await decorate(row));
    } catch (err) {
      if (![403, 404].includes(err.statusCode)) throw err;
    }
  }
  return new ApiResponse(200, { shares: result, nextCursor: rows.length > 20 ? rows[19]._id : null }).send(res);
});
const unlock = asyncHandler(async (req, res) => {
  const access = await shares.resolveShare(req.params.id, req.userId, { password: req.body.password });
  const unlockToken = shares.issueUnlock(req.userId, access.share, access.chain);
  return new ApiResponse(200, { unlockToken }).send(res);
});
async function resource(req, right) {
  const access = await shares.resolveShare(req.params.id, req.userId,
    { unlockToken: req.query.unlock || req.headers['x-share-unlock'] });
  if (!access.share[right]) throw ApiError.forbidden('Share permission denied');
  return access.item;
}
const view = asyncHandler(async (req, res) => {
  const item = await resource(req, 'canView');
  const { objectKey, mimeType, size, category } = item.fileMeta;
  if (!['image', 'video', 'pdf'].includes(category)) throw new ApiError(415, 'Preview unavailable for this file');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Accept-Ranges', 'bytes');
  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Length', size);
    const stream = await minio.getObjectStream(objectKey);
    stream.on('error', () => res.destroy());
    return stream.pipe(res);
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) throw new ApiError(416, 'Invalid range');
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] ? (match[2] ? Number(match[2]) : size - 1) : size - 1;
  if (start > end || end >= size) throw new ApiError(416, 'Invalid range');
  const length = end - start + 1;
  const stream = await minio.getPartialObjectStream(objectKey, start, length);
  res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': length, 'Accept-Ranges': 'bytes' });
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});
const thumbnail = asyncHandler(async (req, res) => {
  const item = await resource(req, 'canView');
  const thumbnailKey = item.fileMeta.thumbnailObjectKey;
  const key = thumbnailKey || (item.fileMeta.category === 'image' ? item.fileMeta.objectKey : null);
  if (!key) throw ApiError.notFound('Thumbnail not found');
  res.setHeader('Content-Type', thumbnailKey ? 'image/webp' : item.fileMeta.mimeType);
  res.setHeader('Cache-Control', 'no-store');
  const stream = await minio.getObjectStream(key);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});
const download = asyncHandler(async (req, res) => {
  const item = await resource(req, 'canDownload');
  const stream = await minio.getObjectStream(item.fileMeta.objectKey);
  const name = item.fileMeta.originalName || item.title;
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  res.setHeader('Content-Type', item.fileMeta.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`);
  res.setHeader('Content-Length', item.fileMeta.size);
  res.setHeader('Cache-Control', 'no-store');
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});
module.exports = { create, update, revoke, outgoing, forItem, received, unlock, view, thumbnail, download };

const User = require('../models/User');
const Item = require('../models/Item');
const RefreshToken = require('../models/RefreshToken');
const AdminAudit = require('../models/AdminAudit');
const storage = require('../services/storage.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const listUsers = asyncHandler(async (req, res) => {
  const { page, q } = req.query;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = q ? { $or: ['name', 'email', 'username'].map((field) => ({ [field]: { $regex: escaped, $options: 'i' } })) } : {};
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20),
    User.countDocuments(filter),
  ]);
  const rows = await Promise.all(users.map(async (user) => ({
    ...user.toSafeJSON(), usedStorageBytes: await storage.getUsedStorageBytes(user._id),
  })));
  return new ApiResponse(200, { users: rows, total, page }).send(res);
});

const updateUser = asyncHandler(async (req, res) => {
  // One API replica: serialize role changes and quota changes with ongoing uploads.
  const user = await storage.withUserUploadLock('admin-management', () =>
    storage.withUserUploadLock(req.params.id, async () => {
      const actor = await User.findById(req.userId);
      if (actor?.role !== 'admin' || actor.status !== 'active') throw ApiError.forbidden();
      const target = await User.findById(req.params.id).select('+sessionVersion');
      if (!target) throw ApiError.notFound('User not found');
      if (req.params.id === req.userId && (req.body.role === 'user' || req.body.status === 'disabled')) {
        throw ApiError.badRequest('Cannot remove your own administrator access');
      }
      if (target.role === 'admin' && target.status === 'active' &&
          (req.body.role === 'user' || req.body.status === 'disabled') &&
          await User.countDocuments({ role: 'admin', status: 'active' }) <= 1) {
        throw ApiError.conflict('At least one active administrator is required');
      }
      const changes = {};
      const emailChanged = req.body.email && req.body.email !== target.email;
      for (const [field, value] of Object.entries(req.body)) {
        if (target[field] !== value) changes[field] = { before: target[field], after: value };
        target[field] = value;
      }
      if (emailChanged) {
        target.emailVerificationRequired = true;
        target.emailVerifiedAt = null;
      }
      if (req.body.status === 'disabled' || emailChanged) target.sessionVersion += 1;
      await target.save();
      if (req.body.status === 'disabled' || emailChanged) {
        await RefreshToken.updateMany({ user: target._id }, { $set: { revoked: true } });
      }
      await AdminAudit.create({ actor: req.userId, target: target._id, action: 'update-user', changes });
      return target;
    }));
  return new ApiResponse(200, { user: user.toSafeJSON(), usedStorageBytes: await storage.getUsedStorageBytes(user._id) }).send(res);
});

const listFiles = asyncHandler(async (req, res) => {
  if (!await User.exists({ _id: req.params.id })) throw ApiError.notFound('User not found');
  const filter = { user: req.params.id, type: 'file' };
  const [items, total] = await Promise.all([
    Item.find(filter).select('title fileMeta.size fileMeta.mimeType isTrashed createdAt')
      .sort({ createdAt: -1, _id: -1 }).skip((req.query.page - 1) * 20).limit(20),
    Item.countDocuments(filter),
  ]);
  return new ApiResponse(200, { items, total, page: req.query.page }).send(res);
});

const fileAction = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.itemId, user: req.params.id, type: 'file' });
  if (!item) throw ApiError.notFound('File not found');
  item.isTrashed = req.body.isTrashed;
  item.trashedAt = item.isTrashed ? new Date() : null;
  await item.save();
  await AdminAudit.create({ actor: req.userId, target: req.params.id, action: item.isTrashed ? 'trash-file' : 'restore-file', changes: { itemId: item._id } });
  return new ApiResponse(200, { item }).send(res);
});
const audit = asyncHandler(async (req, res) => {
  const filter = { target: req.params.id };
  const [events, total] = await Promise.all([
    AdminAudit.find(filter).sort({ createdAt: -1 }).skip((req.query.page - 1) * 20).limit(20).populate('actor', 'name'),
    AdminAudit.countDocuments(filter),
  ]);
  return new ApiResponse(200, { events, total }).send(res);
});
const deleteFile = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.itemId, user: req.params.id, type: 'file', isTrashed: true });
  if (!item) throw ApiError.notFound('File must be in Trash before permanent deletion');
  await require('../models/FileShare').deleteMany({ item: item._id });
  const { minioClient } = require('../config/minio');
  const { BUCKET } = require('../services/minio.service');
  for (const key of [item.fileMeta.objectKey, item.fileMeta.thumbnailObjectKey].filter(Boolean)) {
    await minioClient.removeObject(BUCKET, key);
  }
  await item.deleteOne();
  await AdminAudit.create({ actor: req.userId, target: req.params.id, action: 'delete-file', changes: { itemId: item._id } });
  return new ApiResponse(200, null, 'File permanently deleted').send(res);
});
module.exports = { listUsers, updateUser, listFiles, fileAction, deleteFile, audit };

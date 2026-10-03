const crypto = require('node:crypto');
const sharp = require('sharp');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const storage = require('../services/storage.service');
const minio = require('../services/minio.service');
const { avatarClient } = require('../config/minio');

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.userId, { $set: req.body }, { new: true, runValidators: true });
  return new ApiResponse(200, { user: user.toSafeJSON() }).send(res);
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose an image');
  let image;
  try {
    image = await sharp(req.file.buffer, { limitInputPixels: 16000000 })
      .rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  } catch {
    throw ApiError.badRequest('Avatar must be a valid image (maximum 16 megapixels)');
  }
  const user = await storage.withUserUploadLock(req.userId, async () => {
    const current = await User.findById(req.userId);
    if (!current || current.status !== 'active') throw ApiError.forbidden();
    const key = `avatars/${req.userId}/${crypto.randomUUID()}.webp`;
    await minio.uploadBuffer(key, image, 'image/webp');
    const previous = current.avatarObjectKey;
    try {
      current.avatarObjectKey = key;
      await current.save();
    } catch (error) {
      await minio.removeObject(key);
      throw error;
    }
    await minio.removeObject(previous);
    return current;
  });
  return new ApiResponse(200, { user: user.toSafeJSON() }).send(res);
});

const avatar = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId && req.user.role !== 'admin') throw ApiError.forbidden();
  const user = await User.findById(req.params.id);
  if (!user?.avatarObjectKey) throw ApiError.notFound('Avatar not found');
  // Browser fetches the bytes directly from MinIO; no local file or public bucket.
  const url = await avatarClient.presignedGetObject(minio.BUCKET, user.avatarObjectKey, 300);
  res.setHeader('Cache-Control', 'no-store');
  res.redirect(url);
});
module.exports = { updateProfile, uploadAvatar, avatar };

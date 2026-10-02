const Item = require('../models/Item');
const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Uploaded file bytes recorded for a user, including files in Trash. */
async function getUsedStorageBytes(userId) {
  const [agg] = await Item.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), type: 'file' } },
    { $group: { _id: null, total: { $sum: '$fileMeta.size' } } },
  ]);
  return agg?.total || 0;
}

/**
 * Throws 413 if uploading `incomingBytes` more would exceed the configured
 * per-user quota. Files in Trash still occupy storage until purged.
 */
async function assertWithinQuota(userId, incomingBytes) {
  const used = await getUsedStorageBytes(userId);
  if (used + incomingBytes > env.uploads.maxStoragePerUserBytes) {
    throw ApiError.payloadTooLarge(
      `Storage quota exceeded. Used ${(used / 1024 / 1024).toFixed(1)}MB of ` +
        `${(env.uploads.maxStoragePerUserBytes / 1024 / 1024).toFixed(0)}MB allowed.`
    );
  }
}

// This deployment runs one API replica. Serialize each user's quota check,
// object upload and Item creation so concurrent requests cannot overfill it.
const uploadQueues = new Map();

async function withUserUploadLock(userId, upload) {
  const previous = uploadQueues.get(userId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  uploadQueues.set(userId, current);
  await previous;
  try {
    return await upload();
  } finally {
    release();
    if (uploadQueues.get(userId) === current) uploadQueues.delete(userId);
  }
}

module.exports = { getUsedStorageBytes, assertWithinQuota, withUserUploadLock };

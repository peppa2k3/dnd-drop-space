const Item = require('../models/Item');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Total bytes of non-trashed file-type items owned by a user. */
async function getUsedStorageBytes(userId) {
  const [agg] = await Item.aggregate([
    { $match: { user: userId, type: 'file', isTrashed: false } },
    { $group: { _id: null, total: { $sum: '$fileMeta.size' } } },
  ]);
  return agg?.total || 0;
}

/**
 * Throws 413 if uploading `incomingBytes` more would exceed the configured
 * per-user soft quota. No-op when no quota is configured.
 */
async function assertWithinQuota(userId, incomingBytes) {
  if (env.uploads.maxStoragePerUserBytes === null) return;

  const used = await getUsedStorageBytes(userId);
  if (used + incomingBytes > env.uploads.maxStoragePerUserBytes) {
    throw ApiError.payloadTooLarge(
      `Storage quota exceeded. Used ${(used / 1024 / 1024).toFixed(1)}MB of ` +
        `${(env.uploads.maxStoragePerUserBytes / 1024 / 1024).toFixed(0)}MB allowed.`
    );
  }
}

module.exports = { getUsedStorageBytes, assertWithinQuota };

const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const minioService = require('../services/minio.service');
const logger = require('../utils/logger');

/** Shared by the "empty trash" endpoint and the scheduled auto-purge job. */
async function permanentlyDeleteItems(filter) {
  const items = await Item.find(filter);
  if (items.length === 0) return 0;

  const objectKeys = items.flatMap((item) => [
    item.fileMeta?.objectKey,
    item.fileMeta?.thumbnailObjectKey,
    item.urlMeta?.thumbnailObjectKey,
  ]);
  await minioService.removeObjects(objectKeys);

  await Item.deleteMany({ _id: { $in: items.map((i) => i._id) } });
  return items.length;
}

const emptyTrash = asyncHandler(async (req, res) => {
  const deletedCount = await permanentlyDeleteItems({ user: req.userId, isTrashed: true });
  return new ApiResponse(200, { deletedCount }, 'Trash emptied').send(res);
});

/** Permanently removes anything that has been in Trash longer than the configured retention window. */
async function autoPurgeExpiredTrash(retentionDays) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const deletedCount = await permanentlyDeleteItems({ isTrashed: true, trashedAt: { $lte: cutoff } });
  if (deletedCount > 0) logger.info(`Trash auto-purge removed ${deletedCount} item(s) older than ${retentionDays}d`);
  return deletedCount;
}

module.exports = { emptyTrash, autoPurgeExpiredTrash, permanentlyDeleteItems };

const Item = require('../models/Item');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const storageService = require('../services/storage.service');
const env = require('../config/env');
const { attachResourceUrls } = require('./item.controller');

const stats = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const baseMatch = { user: new mongoose.Types.ObjectId(userId), isTrashed: false };

  const [counts, usedStorageBytes, recentItems] = await Promise.all([
    Item.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: { $cond: [{ $eq: ['$type', 'note'] }, 1, 0] } },
          totalUrls: { $sum: { $cond: [{ $eq: ['$type', 'url'] }, 1, 0] } },
          totalFiles: { $sum: { $cond: [{ $eq: ['$type', 'file'] }, 1, 0] } },
          totalImages: { $sum: { $cond: [{ $eq: ['$fileMeta.category', 'image'] }, 1, 0] } },
          totalVideos: { $sum: { $cond: [{ $eq: ['$fileMeta.category', 'video'] }, 1, 0] } },
          totalFavorites: { $sum: { $cond: ['$favorite', 1, 0] } },
        },
      },
    ]),
    storageService.getUsedStorageBytes(userId),
    Item.find(baseMatch)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('folder', 'name')
      .populate('tags', 'name color'),
  ]);

  const summary = counts[0] || {
    totalNotes: 0,
    totalUrls: 0,
    totalFiles: 0,
    totalImages: 0,
    totalVideos: 0,
    totalFavorites: 0,
  };
  delete summary._id;

  return new ApiResponse(200, {
    ...summary,
    usedStorageBytes,
    storageLimitBytes: env.uploads.maxStoragePerUserBytes,
    recentItems: recentItems.map(attachResourceUrls),
  }).send(res);
});

module.exports = { stats };

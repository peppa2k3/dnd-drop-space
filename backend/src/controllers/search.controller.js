const mongoose = require('mongoose');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');

/** Escapes user input before it's dropped into a MongoDB regex. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches title, description, note content, url fields and file names
 * directly on the Item, plus tag names and folder names via $lookup - all
 * combined with a single $or so "tìm kiếm trên toàn bộ dữ liệu" genuinely
 * covers every field the spec calls out (title, tag, folder, note content,
 * file name) in one request.
 */
const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) throw ApiError.badRequest('Query parameter "q" is required');

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const regex = new RegExp(escapeRegex(q), 'i');
  const { type } = req.query;

  const matchStage = {
    user: new mongoose.Types.ObjectId(req.userId),
    isTrashed: false,
    ...(type ? { type } : {}),
  };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'tags',
        localField: 'tags',
        foreignField: '_id',
        as: 'tagDocs',
      },
    },
    {
      $lookup: {
        from: 'folders',
        localField: 'folder',
        foreignField: '_id',
        as: 'folderDoc',
      },
    },
    {
      $match: {
        $or: [
          { title: regex },
          { description: regex },
          { 'noteContent.content': regex },
          { 'urlMeta.url': regex },
          { 'urlMeta.ogTitle': regex },
          { 'urlMeta.ogDescription': regex },
          { 'fileMeta.originalName': regex },
          { 'tagDocs.name': regex },
          { 'folderDoc.name': regex },
        ],
      },
    },
    { $sort: { updatedAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Item.aggregate(pipeline);
  const total = result.totalCount[0]?.count || 0;

  await Item.populate(result.data, [
    { path: 'folder', select: 'name' },
    { path: 'tags', select: 'name color' },
  ]);

  const { attachResourceUrls } = require('./item.controller');
  const items = result.data.map(attachResourceUrls);

  return new ApiResponse(200, { items, query: q }, 'OK', buildMeta({ page, limit, total })).send(res);
});

module.exports = { search };

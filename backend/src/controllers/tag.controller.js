const Tag = require('../models/Tag');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const tags = await Tag.aggregate([
    { $match: { user: req.userId } },
    {
      $lookup: {
        from: 'items',
        let: { tagId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $in: ['$$tagId', '$tags'] }, { $eq: ['$isTrashed', false] }] } } },
          { $count: 'count' },
        ],
        as: 'usage',
      },
    },
    {
      $addFields: { itemCount: { $ifNull: [{ $arrayElemAt: ['$usage.count', 0] }, 0] } },
    },
    { $project: { usage: 0 } },
    { $sort: { name: 1 } },
  ]);

  return new ApiResponse(200, { tags }).send(res);
});

const create = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  const normalized = name.trim().toLowerCase();

  const existing = await Tag.findOne({ user: req.userId, name: normalized });
  if (existing) throw ApiError.conflict('This tag already exists');

  const tag = await Tag.create({ user: req.userId, name: normalized, color });
  return new ApiResponse(201, { tag }, 'Tag created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  const tag = await Tag.findOne({ _id: id, user: req.userId });
  if (!tag) throw ApiError.notFound('Tag not found');

  if (name !== undefined) tag.name = name.trim().toLowerCase();
  if (color !== undefined) tag.color = color;

  await tag.save();
  return new ApiResponse(200, { tag }, 'Tag updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tag = await Tag.findOne({ _id: id, user: req.userId });
  if (!tag) throw ApiError.notFound('Tag not found');

  await Item.updateMany({ user: req.userId, tags: tag._id }, { $pull: { tags: tag._id } });
  await tag.deleteOne();

  return new ApiResponse(200, null, 'Tag deleted').send(res);
});

module.exports = { list, create, update, remove };

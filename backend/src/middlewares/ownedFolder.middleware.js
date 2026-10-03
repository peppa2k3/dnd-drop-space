const Folder = require('../models/Folder');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

module.exports = asyncHandler(async (req, res, next) => {
  if (req.body.folder && !await Folder.exists({ _id: req.body.folder, user: req.userId })) {
    throw ApiError.badRequest('Folder not found');
  }
  next();
});

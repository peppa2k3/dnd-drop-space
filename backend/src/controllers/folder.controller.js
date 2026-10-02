const Folder = require('../models/Folder');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/** BFS over the folder tree to collect every descendant folder id (any depth). */
async function getDescendantFolderIds(userId, rootFolderId) {
  const all = [rootFolderId];
  let frontier = [rootFolderId];

  while (frontier.length > 0) {
    const children = await Folder.find({ user: userId, parent: { $in: frontier } }).select('_id');
    const childIds = children.map((c) => c._id);
    if (childIds.length === 0) break;
    all.push(...childIds);
    frontier = childIds;
  }

  return all;
}

const list = asyncHandler(async (req, res) => {
  const folders = await Folder.find({ user: req.userId }).sort({ name: 1 }).lean();
  return new ApiResponse(200, { folders }).send(res);
});

const create = asyncHandler(async (req, res) => {
  const { name, parent = null } = req.body;

  if (parent) {
    const parentFolder = await Folder.findOne({ _id: parent, user: req.userId });
    if (!parentFolder) throw ApiError.badRequest('Parent folder not found');
  }

  const folder = await Folder.create({ name, parent: parent || null, user: req.userId });
  return new ApiResponse(201, { folder }, 'Folder created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, parent, color } = req.body;

  const folder = await Folder.findOne({ _id: id, user: req.userId });
  if (!folder) throw ApiError.notFound('Folder not found');

  if (parent !== undefined && parent !== null) {
    if (parent === id) throw ApiError.badRequest('A folder cannot be its own parent');
    const descendantIds = await getDescendantFolderIds(req.userId, folder._id);
    if (descendantIds.some((d) => d.toString() === parent)) {
      throw ApiError.badRequest('Cannot move a folder into one of its own subfolders');
    }
    const parentFolder = await Folder.findOne({ _id: parent, user: req.userId });
    if (!parentFolder) throw ApiError.badRequest('Parent folder not found');
  }

  if (name !== undefined) folder.name = name;
  if (parent !== undefined) folder.parent = parent || null;
  if (color !== undefined) folder.color = color;

  await folder.save();
  return new ApiResponse(200, { folder }, 'Folder updated').send(res);
});

/**
 * Deleting a folder deletes it and all of its subfolders, and moves every
 * item inside any of them to Trash (rather than permanently destroying
 * user data as a side-effect of a folder edit).
 */
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const folder = await Folder.findOne({ _id: id, user: req.userId });
  if (!folder) throw ApiError.notFound('Folder not found');

  const folderIds = await getDescendantFolderIds(req.userId, folder._id);

  await Item.updateMany(
    { user: req.userId, folder: { $in: folderIds }, isTrashed: false },
    { isTrashed: true, trashedAt: new Date() }
  );

  await Folder.deleteMany({ _id: { $in: folderIds }, user: req.userId });

  return new ApiResponse(200, { deletedFolderIds: folderIds }, 'Folder deleted, its items were moved to Trash').send(
    res
  );
});

module.exports = { list, create, update, remove, getDescendantFolderIds };

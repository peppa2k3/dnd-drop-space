const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { findOrCreateTagIds } = require('../services/tag.service');
const urlMetaService = require('../services/urlMeta.service');
const minioService = require('../services/minio.service');

const SORTABLE_FIELDS = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  title: 'title',
  size: 'fileMeta.size',
};

/** Attaches ready-to-use resource URLs so the frontend never has to hand-build them. */
function attachResourceUrls(itemDoc) {
  const item = itemDoc.toObject ? itemDoc.toObject() : itemDoc;
  const id = item._id;
  const urls = {};

  if (item.type === 'file') {
    urls.download = `/api/items/${id}/download`;
    if (['image', 'video', 'pdf'].includes(item.fileMeta?.category)) {
      urls.stream = `/api/items/${id}/stream`;
    }
    if (item.fileMeta?.thumbnailObjectKey || item.fileMeta?.category === 'image') {
      urls.thumbnail = `/api/items/${id}/thumbnail`;
    }
  }

  if (item.type === 'url') {
    urls.thumbnail = item.urlMeta?.thumbnailObjectKey
      ? `/api/items/${id}/thumbnail`
      : item.urlMeta?.thumbnailUrl || null;
  }

  return { ...item, urls };
}

function buildListFilter(req) {
  const { type, category, folder, tag, favorite, isTrashed } = req.query;
  const filter = { user: req.userId, isTrashed: isTrashed === 'true' };

  if (type) filter.type = type;
  if (category) filter['fileMeta.category'] = category;
  if (favorite === 'true') filter.favorite = true;

  if (folder === 'root') filter.folder = null;
  else if (folder) filter.folder = folder;

  if (tag) filter.tags = tag;

  return filter;
}

const list = asyncHandler(async (req, res) => {
  const filter = buildListFilter(req);
  const { page, limit, skip } = parsePagination(req.query);

  const sortField = SORTABLE_FIELDS[req.query.sort] || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Item.find(filter)
      .populate('folder', 'name')
      .populate('tags', 'name color')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Item.countDocuments(filter),
  ]);

  return new ApiResponse(200, { items: items.map(attachResourceUrls) }, 'OK', buildMeta({ page, limit, total })).send(
    res
  );
});

const getOne = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId })
    .populate('folder', 'name')
    .populate('tags', 'name color');

  if (!item) throw ApiError.notFound('Item not found');
  return new ApiResponse(200, { item: attachResourceUrls(item) }).send(res);
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

const createNote = asyncHandler(async (req, res) => {
  const { title, description = '', content = '', folder = null, tags = [], favorite = false } = req.body;
  const tagIds = await findOrCreateTagIds(req.userId, tags);

  const item = await Item.create({
    user: req.userId,
    type: 'note',
    title,
    description,
    folder,
    tags: tagIds,
    favorite,
    noteContent: { format: 'markdown', content },
  });

  return new ApiResponse(201, { item: attachResourceUrls(item) }, 'Note created').send(res);
});

const updateNoteContent = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId, type: 'note' });
  if (!item) throw ApiError.notFound('Note not found');

  item.noteContent.content = req.body.content;
  await item.save();

  return new ApiResponse(200, { item: attachResourceUrls(item) }, 'Note saved').send(res);
});

// ---------------------------------------------------------------------------
// URL bookmarks
// ---------------------------------------------------------------------------

const createUrl = asyncHandler(async (req, res) => {
  const { url, title, description = '', folder = null, tags = [], favorite = false } = req.body;
  const tagIds = await findOrCreateTagIds(req.userId, tags);

  let meta = {};
  try {
    meta = await urlMetaService.fetchUrlMetadata(url, req.userId);
  } catch (err) {
    // A bookmark is still useful even if we couldn't scrape a preview for
    // it (dead link, site blocks bots, etc.) - save it with what we have.
    meta = {};
  }

  const item = await Item.create({
    user: req.userId,
    type: 'url',
    title: title || meta.ogTitle || url,
    description: description || meta.ogDescription || '',
    folder,
    tags: tagIds,
    favorite,
    urlMeta: {
      url,
      siteName: meta.siteName || null,
      ogTitle: meta.ogTitle || null,
      ogDescription: meta.ogDescription || null,
      favicon: meta.favicon || null,
      thumbnailUrl: meta.thumbnailUrl || null,
      thumbnailObjectKey: meta.thumbnailObjectKey || null,
    },
  });

  return new ApiResponse(201, { item: attachResourceUrls(item) }, 'Bookmark saved').send(res);
});

// ---------------------------------------------------------------------------
// Generic update (title, description, folder, tags, favorite) - works for
// notes, urls and files alike since they all share the same envelope.
// ---------------------------------------------------------------------------

const update = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId });
  if (!item) throw ApiError.notFound('Item not found');

  const { title, description, folder, tags, favorite } = req.body;

  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (folder !== undefined) item.folder = folder || null;
  if (favorite !== undefined) item.favorite = favorite;
  if (tags !== undefined) item.tags = await findOrCreateTagIds(req.userId, tags);

  await item.save();
  await item.populate([
    { path: 'folder', select: 'name' },
    { path: 'tags', select: 'name color' },
  ]);

  return new ApiResponse(200, { item: attachResourceUrls(item) }, 'Item updated').send(res);
});

const toggleFavorite = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId });
  if (!item) throw ApiError.notFound('Item not found');

  item.favorite = !item.favorite;
  await item.save();

  return new ApiResponse(200, { item: attachResourceUrls(item) }, item.favorite ? 'Added to favorites' : 'Removed from favorites').send(
    res
  );
});

// ---------------------------------------------------------------------------
// Trash
// ---------------------------------------------------------------------------

const moveToTrash = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId, isTrashed: false });
  if (!item) throw ApiError.notFound('Item not found');

  item.isTrashed = true;
  item.trashedAt = new Date();
  await item.save();

  return new ApiResponse(200, null, 'Moved to Trash').send(res);
});

const restoreFromTrash = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId, isTrashed: true });
  if (!item) throw ApiError.notFound('Item not found in Trash');

  item.isTrashed = false;
  item.trashedAt = null;
  await item.save();

  return new ApiResponse(200, { item: attachResourceUrls(item) }, 'Restored').send(res);
});

const permanentlyDelete = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId });
  if (!item) throw ApiError.notFound('Item not found');

  if (item.type === 'file') await require('../models/FileShare').deleteMany({ item: item._id });

  if (item.type === 'file') {
    await minioService.removeObjects([item.fileMeta?.objectKey, item.fileMeta?.thumbnailObjectKey]);
  }
  if (item.type === 'url' && item.urlMeta?.thumbnailObjectKey) {
    await minioService.removeObject(item.urlMeta.thumbnailObjectKey);
  }

  await item.deleteOne();
  return new ApiResponse(200, null, 'Permanently deleted').send(res);
});

module.exports = {
  list,
  getOne,
  createNote,
  updateNoteContent,
  createUrl,
  update,
  toggleFavorite,
  moveToTrash,
  restoreFromTrash,
  permanentlyDelete,
  attachResourceUrls,
};

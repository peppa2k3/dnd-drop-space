const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { detectFileCategory } = require('../utils/fileType');
const minioService = require('../services/minio.service');
const thumbnailService = require('../services/thumbnail.service');
const storageService = require('../services/storage.service');
const { findOrCreateTagIds } = require('../services/tag.service');

/** Uploads one already-received file (buffer in memory) to MinIO + builds its Item. */
async function persistUploadedFile(file, { userId, folder, tags, description }) {
  const category = detectFileCategory(file.mimetype, file.originalname);
  const ext = path.extname(file.originalname);
  const objectKey = `${userId}/files/${uuidv4()}${ext}`;

  await storageService.assertWithinQuota(userId, file.size);
  await minioService.uploadBuffer(objectKey, file.buffer, file.mimetype);

  let thumbnailObjectKey = null;
  let width = null;
  let height = null;
  let durationSeconds = null;

  if (category === 'image') {
    const result = await thumbnailService.generateImageThumbnail(file.buffer);
    width = result.width;
    height = result.height;
    if (result.thumbnailBuffer) {
      thumbnailObjectKey = `${userId}/thumbnails/${uuidv4()}.webp`;
      await minioService.uploadBuffer(thumbnailObjectKey, result.thumbnailBuffer, 'image/webp');
    }
  } else if (category === 'video') {
    const result = await thumbnailService.generateVideoThumbnail(file.buffer, file.originalname);
    durationSeconds = result.durationSeconds;
    if (result.thumbnailBuffer) {
      thumbnailObjectKey = `${userId}/thumbnails/${uuidv4()}.webp`;
      await minioService.uploadBuffer(thumbnailObjectKey, result.thumbnailBuffer, 'image/webp');
    }
  }

  return Item.create({
    user: userId,
    type: 'file',
    title: file.originalname,
    description,
    folder,
    tags,
    fileMeta: {
      category,
      originalName: file.originalname,
      extension: ext.replace('.', ''),
      mimeType: file.mimetype,
      size: file.size,
      bucket: minioService.BUCKET,
      objectKey,
      thumbnailObjectKey,
      width,
      height,
      durationSeconds,
    },
  });
}

const uploadFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw ApiError.badRequest('No files were uploaded');

  const { folder = null, tags = [], description = '' } = req.body;
  const tagIds = await findOrCreateTagIds(req.userId, tags || []);

  // Sequential on purpose: quota checks and MinIO/ffmpeg work are I/O and
  // CPU heavy per file, and running many at once could spike memory since
  // files are buffered in RAM (see upload.middleware.js).
  const created = [];
  for (const file of req.files) {
    const item = await persistUploadedFile(file, {
      userId: req.userId,
      folder: folder || null,
      tags: tagIds,
      description,
    });
    created.push(item);
  }

  const { attachResourceUrls } = require('./item.controller');
  return new ApiResponse(201, { items: created.map(attachResourceUrls) }, `${created.length} file(s) uploaded`).send(
    res
  );
});

async function findOwnedFileItem(req) {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId, type: 'file' });
  if (!item) throw ApiError.notFound('File not found');
  return item;
}

const downloadFile = asyncHandler(async (req, res) => {
  const item = await findOwnedFileItem(req);
  const stream = await minioService.getObjectStream(item.fileMeta.objectKey);

  res.setHeader('Content-Type', item.fileMeta.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.fileMeta.originalName)}"`);
  res.setHeader('Content-Length', item.fileMeta.size);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

const getThumbnail = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, user: req.userId });
  if (!item) throw ApiError.notFound('Item not found');

  const thumbnailKey = item.fileMeta?.thumbnailObjectKey || item.urlMeta?.thumbnailObjectKey;

  // Images without a generated thumbnail (e.g. formats sharp couldn't
  // parse) fall back to serving the original file itself.
  const objectKey = thumbnailKey || (item.fileMeta?.category === 'image' ? item.fileMeta.objectKey : null);
  if (!objectKey) throw ApiError.notFound('No thumbnail available for this item');

  const stream = await minioService.getObjectStream(objectKey);
  res.setHeader('Content-Type', thumbnailKey ? 'image/webp' : item.fileMeta.mimeType);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

/**
 * Streams a file with HTTP Range support - required for the <video> tag to
 * seek, and it's also what lets PDFs/images preview inline in the browser
 * instead of only being downloadable.
 */
const streamFile = asyncHandler(async (req, res) => {
  const item = await findOwnedFileItem(req);
  const { objectKey, mimeType, size } = item.fileMeta;

  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', size);
    res.setHeader('Accept-Ranges', 'bytes');
    const stream = await minioService.getObjectStream(objectKey);
    stream.on('error', () => res.destroy());
    return stream.pipe(res);
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : size - 1;
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': mimeType,
  });

  const stream = await minioService.getPartialObjectStream(objectKey, start, chunkSize);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

module.exports = { uploadFiles, downloadFile, getThumbnail, streamFile };

const { minioClient } = require('../config/minio');
const env = require('../config/env');
const logger = require('../utils/logger');

const BUCKET = env.minio.bucket;

/** Uploads an in-memory buffer as an object. Returns the object key it was stored under. */
async function uploadBuffer(objectKey, buffer, mimeType) {
  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    'Content-Type': mimeType || 'application/octet-stream',
  });
  return objectKey;
}

/** Full object as a readable stream (used for downloads / images / PDFs / notes attachments). */
async function getObjectStream(objectKey) {
  return minioClient.getObject(BUCKET, objectKey);
}

/** Byte-range stream, used to serve `Range:` requests for video streaming. */
async function getPartialObjectStream(objectKey, offset, length) {
  return minioClient.getPartialObject(BUCKET, objectKey, offset, length);
}

async function statObject(objectKey) {
  return minioClient.statObject(BUCKET, objectKey);
}

async function removeObject(objectKey) {
  if (!objectKey) return;
  try {
    await minioClient.removeObject(BUCKET, objectKey);
  } catch (err) {
    // Non-fatal: we never want a missing/duplicate-deleted object to block
    // the rest of a delete operation (e.g. removing the DB record).
    logger.warn(`Failed to remove MinIO object ${objectKey}:`, err.message);
  }
}

async function removeObjects(objectKeys = []) {
  const keys = objectKeys.filter(Boolean);
  if (keys.length === 0) return;
  try {
    await minioClient.removeObjects(BUCKET, keys);
  } catch (err) {
    logger.warn('Failed to bulk remove MinIO objects:', err.message);
  }
}

module.exports = {
  BUCKET,
  uploadBuffer,
  getObjectStream,
  getPartialObjectStream,
  statObject,
  removeObject,
  removeObjects,
};

const ogs = require('open-graph-scraper');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const logger = require('../utils/logger');
const minioService = require('./minio.service');

/** Resolves a possibly-relative favicon/image URL against the page's own URL. */
function resolveUrl(maybeRelative, baseUrl) {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

const MAX_THUMBNAIL_BYTES = 8 * 1024 * 1024; // 8MB safety cap

/**
 * Downloads a remote thumbnail image and mirrors it into MinIO so the
 * bookmark preview keeps working even if the source page later changes or
 * disappears. Falls back to returning null (caller keeps the remote URL)
 * if anything about the download looks wrong or fails.
 */
async function mirrorThumbnail(imageUrl, userId) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: env.urlFetchTimeoutMs,
      maxContentLength: MAX_THUMBNAIL_BYTES,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PersonalKnowledgeHub/1.0)' },
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) return null;

    const objectKey = `${userId}/url-thumbnails/${uuidv4()}`;
    await minioService.uploadBuffer(objectKey, Buffer.from(response.data), contentType);
    return objectKey;
  } catch (err) {
    logger.warn(`Could not mirror URL thumbnail (${imageUrl}):`, err.message);
    return null;
  }
}

/**
 * Fetches Open Graph / meta data for a URL: title, description, image,
 * favicon and site name — the fields needed to render a Pocket-style
 * bookmark card.
 */
async function fetchUrlMetadata(targetUrl, userId) {
  const { result } = await ogs({
    url: targetUrl,
    timeout: env.urlFetchTimeoutMs,
    fetchOptions: { headers: { 'user-agent': 'Mozilla/5.0 (compatible; PersonalKnowledgeHub/1.0)' } },
  });

  const ogImage = Array.isArray(result.ogImage) ? result.ogImage[0] : result.ogImage;
  const imageUrl = resolveUrl(ogImage?.url, targetUrl);
  const favicon = resolveUrl(result.favicon, targetUrl);

  let thumbnailObjectKey = null;
  if (imageUrl) {
    thumbnailObjectKey = await mirrorThumbnail(imageUrl, userId);
  }

  return {
    ogTitle: result.ogTitle || result.twitterTitle || null,
    ogDescription: result.ogDescription || result.twitterDescription || null,
    siteName: result.ogSiteName || new URL(targetUrl).hostname,
    favicon,
    thumbnailUrl: thumbnailObjectKey ? null : imageUrl, // keep remote URL only if we couldn't mirror it
    thumbnailObjectKey,
  };
}

module.exports = { fetchUrlMetadata };

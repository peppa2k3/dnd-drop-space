const os = require('os');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const logger = require('../utils/logger');

ffmpeg.setFfmpegPath(ffmpegPath);

const THUMB_WIDTH = 480;

/**
 * Resizes an image buffer down to a small webp thumbnail.
 * Returns { buffer, width, height } of the ORIGINAL image (so we can also
 * store true dimensions on the Item), plus the thumbnail buffer itself.
 */
async function generateImageThumbnail(buffer) {
  const image = sharp(buffer, { failOn: 'none' });
  const metadata = await image.metadata();

  const thumbnailBuffer = await image
    .clone()
    .rotate() // auto-orient based on EXIF
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  return {
    thumbnailBuffer,
    width: metadata.width || null,
    height: metadata.height || null,
  };
}

/**
 * Grabs a single frame near the start of a video and returns it as a small
 * webp thumbnail, plus the video duration in seconds. ffmpeg needs real
 * files (not buffers) for this, so we round-trip through the OS tmp dir.
 */
async function generateVideoThumbnail(buffer, originalName = 'video') {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pkh-video-'));
  const inputExt = path.extname(originalName) || '.mp4';
  const inputPath = path.join(tmpDir, `input${inputExt}`);
  const outputPath = path.join(tmpDir, `${crypto.randomUUID()}.png`);

  try {
    await fs.writeFile(inputPath, buffer);

    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) return reject(err);
        resolve(data?.format?.duration || null);
      });
    });

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .on('end', resolve)
        .on('error', reject)
        .screenshots({
          count: 1,
          timestamps: ['1'],
          filename: path.basename(outputPath),
          folder: tmpDir,
          size: `${THUMB_WIDTH}x?`,
        });
    });

    const rawFrame = await fs.readFile(outputPath);
    const thumbnailBuffer = await sharp(rawFrame).webp({ quality: 78 }).toBuffer();

    return { thumbnailBuffer, durationSeconds: duration };
  } catch (err) {
    logger.warn(`Video thumbnail generation skipped for "${originalName}":`, err.message);
    return { thumbnailBuffer: null, durationSeconds: null };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { generateImageThumbnail, generateVideoThumbnail };

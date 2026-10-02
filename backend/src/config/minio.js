const Minio = require('minio');
const env = require('./env');
const logger = require('../utils/logger');

const minioClient = new Minio.Client({
  endPoint: env.minio.endPoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey,
});

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 2000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ensures the application bucket exists on boot so a fresh MinIO
 * deployment (e.g. first `docker compose up`) works out of the box
 * without any manual setup step. Retries for a while since the MinIO
 * container may still be starting up when this first runs.
 */
async function ensureBucket() {
  const bucket = env.minio.bucket;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        logger.info(`MinIO bucket created: ${bucket}`);
      } else {
        logger.info(`MinIO bucket ready: ${bucket}`);
      }
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        logger.error('Could not reach MinIO after multiple retries', err);
        process.exit(1);
      }
      logger.warn(`MinIO not ready yet (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

module.exports = { minioClient, ensureBucket };

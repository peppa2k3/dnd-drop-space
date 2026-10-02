const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries the initial connection for a while before giving up. This matters
 * most in `docker compose up`, where the backend container can start
 * before Mongo has finished its own boot sequence.
 */
async function connectDB() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri);
      logger.info(`MongoDB connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
      break;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        logger.error('MongoDB connection failed after multiple retries', err);
        process.exit(1);
      }
      logger.warn(`MongoDB not ready yet (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', err);
  });
}

module.exports = connectDB;

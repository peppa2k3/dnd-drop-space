const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { ensureBucket } = require('./config/minio');
const scheduleTrashAutoPurge = require('./workers/trashPurge.worker');
const logger = require('./utils/logger');

async function bootstrap() {
  await connectDB();
  await ensureBucket();
  scheduleTrashAutoPurge();

  const server = app.listen(env.port, () => {
    logger.info(`Personal Knowledge Hub API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

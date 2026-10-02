const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../utils/logger');
const { autoPurgeExpiredTrash } = require('../controllers/trash.controller');

/**
 * Runs once a day at 03:00 server time. Kept as a simple in-process cron
 * job rather than a Redis/BullMQ queue: for a personal-scale app a single
 * lightweight daily sweep is enough, and it avoids running/operating an
 * extra service. If this ever needs to scale to many users or heavier
 * jobs, this is the seam where a real queue would slot in.
 */
function scheduleTrashAutoPurge() {
  cron.schedule('0 3 * * *', async () => {
    try {
      await autoPurgeExpiredTrash(env.trash.autoPurgeDays);
    } catch (err) {
      logger.error('Trash auto-purge job failed:', err);
    }
  });
  logger.info(`Trash auto-purge scheduled daily (retention: ${env.trash.autoPurgeDays} days)`);
}

module.exports = scheduleTrashAutoPurge;

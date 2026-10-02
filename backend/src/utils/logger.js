/* eslint-disable no-console */
const env = require('../config/env');

const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[INFO]  ${timestamp()}`, ...args),
  warn: (...args) => console.warn(`[WARN]  ${timestamp()}`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()}`, ...args),
  debug: (...args) => {
    if (!env.isProduction) console.debug(`[DEBUG] ${timestamp()}`, ...args);
  },
};

module.exports = logger;

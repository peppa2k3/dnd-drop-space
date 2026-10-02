require('dotenv').config();

/**
 * Centralized, validated access to process.env.
 * Keeping this in one place means the rest of the codebase never touches
 * `process.env` directly and always gets typed / defaulted values.
 */
const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const toIntOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS || '0', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/personal_knowledge_hub'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'pkh_refresh_token',
  },

  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: toBool(process.env.MINIO_USE_SSL, false),
    accessKey: required('MINIO_ACCESS_KEY', 'pkh_admin'),
    secretKey: required('MINIO_SECRET_KEY', 'pkh_admin_secret'),
    bucket: process.env.MINIO_BUCKET || 'pkh-storage',
  },

  uploads: {
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '1024', 10) * 1024 * 1024,
    maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || '20', 10),
    maxStoragePerUserBytes: (toIntOrNull(process.env.MAX_STORAGE_PER_USER_MB) ?? 2048) * 1024 * 1024,
  },

  trash: {
    autoPurgeDays: parseInt(process.env.TRASH_AUTO_PURGE_DAYS || '30', 10),
  },

  urlFetchTimeoutMs: parseInt(process.env.URL_FETCH_TIMEOUT_MS || '8000', 10),
};

module.exports = env;

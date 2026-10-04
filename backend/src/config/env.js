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

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  email: {
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT || '587'),
    secure: toBool(process.env.EMAIL_SECURE),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
  },
  otp: {
    expiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || '5'),
    length: Number(process.env.OTP_LENGTH || '6'),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || '5'),
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60'),
  },

  minio: {
    publicEndPoint: process.env.MINIO_PUBLIC_ENDPOINT || 'localhost',
    publicPort: parseInt(process.env.MINIO_PUBLIC_PORT || '9000', 10),
    publicUseSSL: toBool(process.env.MINIO_PUBLIC_USE_SSL, false),
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
  },

  trash: {
    autoPurgeDays: parseInt(process.env.TRASH_AUTO_PURGE_DAYS || '30', 10),
  },

  urlFetchTimeoutMs: parseInt(process.env.URL_FETCH_TIMEOUT_MS || '8000', 10),
};

// A production deployment must not silently use development signing keys or
// start without the providers required by the public authentication flows.
if (env.isProduction) {
  const requiredProductionValues = {
    JWT_ACCESS_SECRET: env.jwt.accessSecret,
    JWT_REFRESH_SECRET: env.jwt.refreshSecret,
    GOOGLE_CLIENT_ID: env.google.clientId,
    EMAIL_HOST: env.email.host,
    EMAIL_USER: env.email.user,
    EMAIL_PASSWORD: env.email.password,
    EMAIL_FROM: env.email.from,
  };
  const missing = Object.entries(requiredProductionValues)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  if ([env.jwt.accessSecret, env.jwt.refreshSecret].some((secret) =>
    secret.length < 32 || secret.startsWith('change_this') || secret.startsWith('dev_')) ||
    env.jwt.accessSecret === env.jwt.refreshSecret) {
    throw new Error('Production JWT secrets must be distinct, non-placeholder, and at least 32 characters');
  }
  let origin;
  try { origin = new URL(env.clientOrigin); }
  catch { throw new Error('CLIENT_ORIGIN must be a valid HTTPS origin in production'); }
  if (origin.protocol !== 'https:' || origin.origin !== env.clientOrigin) {
    throw new Error('CLIENT_ORIGIN must be a valid HTTPS origin in production');
  }
}

if (!Number.isInteger(env.email.port) || env.email.port < 1 || env.email.port > 65535) {
  throw new Error('EMAIL_PORT must be a valid TCP port');
}
if (!Number.isInteger(env.otp.expiresMinutes) || env.otp.expiresMinutes < 1 ||
    !Number.isInteger(env.otp.length) || env.otp.length < 6 || env.otp.length > 8 ||
    !Number.isInteger(env.otp.maxAttempts) || env.otp.maxAttempts < 1 ||
    !Number.isInteger(env.otp.resendCooldownSeconds) || env.otp.resendCooldownSeconds < 1) {
  throw new Error('Invalid OTP configuration');
}

module.exports = env;

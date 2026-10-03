const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), ver: user.sessionVersion || 0 }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/** Parses a "15m" / "7d" style duration into a future Date. */
function expiryFromNow(durationStr) {
  const match = /^(\d+)([smhd])$/.exec(durationStr);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]];
  return new Date(Date.now() + value * unitMs);
}

async function issueTokenPair(user, userAgent) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: userAgent || null,
    expiresAt: expiryFromNow(env.jwt.refreshExpiresIn),
  });

  return { accessToken, refreshToken };
}

async function revokeRefreshToken(token) {
  await RefreshToken.updateOne({ tokenHash: hashToken(token) }, { revoked: true });
}

async function rotateRefreshToken(oldToken, user, userAgent) {
  await revokeRefreshToken(oldToken);
  return issueTokenPair(user, userAgent);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  issueTokenPair,
  revokeRefreshToken,
  rotateRefreshToken,
};

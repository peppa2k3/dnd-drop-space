const crypto = require('node:crypto');
const EmailOtp = require('../models/EmailOtp');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const mail = require('./mail.service');

function digest(value) {
  return crypto.createHmac('sha256', env.jwt.accessSecret).update(`pkh-otp:${value}`).digest('hex');
}
function codeHash(userId, purpose, code) {
  return digest(`${userId}:${purpose}:${code}`);
}
function checkHash(left, right) {
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}
function configured() {
  if (env.otp.length < 6 || env.otp.length > 8 || env.otp.expiresMinutes < 1 ||
      env.otp.maxAttempts < 1 || env.otp.resendCooldownSeconds < 1) {
    throw new Error('Invalid OTP configuration');
  }
}
async function issue(user, purpose) {
  configured();
  const now = new Date();
  const code = String(crypto.randomInt(0, 10 ** env.otp.length)).padStart(env.otp.length, '0');
  const update = { codeHash: codeHash(user._id, purpose, code), attempts: 0,
    sentAt: now, expiresAt: new Date(now.getTime() + env.otp.expiresMinutes * 60000) };
  const existing = await EmailOtp.findOne({ user: user._id, purpose });
  if (existing) {
    const cutoff = new Date(now.getTime() - env.otp.resendCooldownSeconds * 1000);
    const changed = await EmailOtp.updateOne({ _id: existing._id, sentAt: { $lte: cutoff } },
      { $set: update, $unset: { resetTokenHash: '' } });
    if (!changed.modifiedCount) throw new ApiError(429, 'Wait before requesting another code');
  } else {
    try { await EmailOtp.create({ user: user._id, purpose, ...update }); }
    catch (error) {
      if (error.code === 11000) throw new ApiError(429, 'Wait before requesting another code');
      throw error;
    }
  }
  try { await mail.sendOtp(user.email, purpose, code); }
  catch (error) {
    await EmailOtp.updateOne({ user: user._id, purpose, codeHash: update.codeHash },
      { $set: { sentAt: new Date(0) } });
    if (error.statusCode) throw error;
    throw new ApiError(503, 'Email delivery unavailable; please retry');
  }
}
async function checked(user, purpose, code) {
  const row = await EmailOtp.findOne({ user: user._id, purpose }).select('+codeHash');
  if (!row || !row.codeHash || row.expiresAt <= new Date() || row.attempts >= env.otp.maxAttempts) {
    throw ApiError.badRequest('Code expired or unavailable');
  }
  if (!checkHash(row.codeHash, codeHash(user._id, purpose, code))) {
    await EmailOtp.updateOne({ _id: row._id, attempts: { $lt: env.otp.maxAttempts } }, { $inc: { attempts: 1 } });
    throw ApiError.badRequest('Invalid code');
  }
  return row;
}
async function consume(user, purpose, code) {
  const row = await checked(user, purpose, code);
  const result = await EmailOtp.deleteOne({ _id: row._id, codeHash: row.codeHash,
    expiresAt: { $gt: new Date() }, attempts: { $lt: env.otp.maxAttempts } });
  if (!result.deletedCount) throw ApiError.badRequest('Code already used');
}
async function verifyReset(user, code) {
  const row = await checked(user, 'reset', code);
  const secret = crypto.randomBytes(32).toString('hex');
  const hash = digest(`reset:${user._id}:${secret}`);
  const result = await EmailOtp.updateOne({ _id: row._id, codeHash: row.codeHash,
    expiresAt: { $gt: new Date() }, attempts: { $lt: env.otp.maxAttempts } },
  { $set: { resetTokenHash: hash }, $unset: { codeHash: '' } });
  if (!result.modifiedCount) throw ApiError.badRequest('Code already used');
  return `${row._id}.${secret}`;
}
async function consumeReset(user, token) {
  const [id, secret] = token.split('.');
  const result = await EmailOtp.deleteOne({ _id: id, user: user._id, purpose: 'reset',
    resetTokenHash: digest(`reset:${user._id}:${secret}`), expiresAt: { $gt: new Date() } });
  if (!result.deletedCount) throw ApiError.badRequest('Reset token expired or used');
}

module.exports = { issue, consume, verifyReset, consumeReset };

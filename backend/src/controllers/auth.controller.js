const User = require('../models/User');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const EmailOtp = require('../models/EmailOtp');
const tokenService = require('../services/token.service');
const otp = require('../services/otp.service');
const google = require('../services/googleAuth.service');
const mail = require('../services/mail.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const env = require('../config/env');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  path: '/api/auth',
};

function setRefreshCookie(res, token) {
  res.cookie(env.jwt.refreshCookieName, token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res) {
  res.clearCookie(env.jwt.refreshCookieName, REFRESH_COOKIE_OPTIONS);
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!mail.isConfigured()) throw new ApiError(503, 'Email delivery is not configured');

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, emailVerificationRequired: true });
  try { await otp.issue(user, 'verify'); }
  catch (error) {
    await EmailOtp.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id, emailVerifiedAt: null });
    throw error;
  }
  return new ApiResponse(201, { email: user.email, verificationRequired: true }, 'Check your email for a verification code').send(res);
});

const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' });
  if (user && !user.hasVerifiedEmail()) await otp.issue(user, 'verify');
  return new ApiResponse(200, null, 'If verification is needed, a code was sent').send(res);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' });
  if (!user || user.hasVerifiedEmail()) throw ApiError.badRequest('Code expired or unavailable');
  await otp.consume(user, 'verify', req.body.code);
  user.emailVerifiedAt = new Date();
  await user.save();
  return new ApiResponse(200, { emailVerified: true }, 'Email verified; you can now log in').send(res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash +sessionVersion');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'active') throw ApiError.forbidden('Account disabled');
  if (!user.hasVerifiedEmail()) throw ApiError.forbidden('Email verification required');

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);

  return new ApiResponse(200, { user: user.toSafeJSON(), accessToken }, 'Logged in').send(res);
});

const requestLoginOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' });
  if (user?.hasVerifiedEmail()) await otp.issue(user, 'login');
  return new ApiResponse(200, null, 'If the account is eligible, a code was sent').send(res);
});

const loginWithOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' }).select('+sessionVersion');
  if (!user?.hasVerifiedEmail()) throw ApiError.badRequest('Code expired or unavailable');
  await otp.consume(user, 'login', req.body.code);
  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);
  return new ApiResponse(200, { user: user.toSafeJSON(), accessToken }, 'Logged in').send(res);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' });
  if (user?.hasVerifiedEmail()) await otp.issue(user, 'reset');
  return new ApiResponse(200, null, 'If the account is eligible, a code was sent').send(res);
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' });
  if (!user?.hasVerifiedEmail()) throw ApiError.badRequest('Code expired or unavailable');
  const resetToken = await otp.verifyReset(user, req.body.code);
  return new ApiResponse(200, { resetToken }, 'Code verified').send(res);
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, status: 'active' }).select('+sessionVersion');
  if (!user?.hasVerifiedEmail()) throw ApiError.badRequest('Reset token expired or used');
  await otp.consumeReset(user, req.body.resetToken);
  user.passwordHash = await User.hashPassword(req.body.password);
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { $set: { revoked: true } });
  clearRefreshCookie(res);
  return new ApiResponse(200, null, 'Password reset; log in again').send(res);
});

const googleConfig = (req, res) => new ApiResponse(200,
  { clientId: env.google.clientId || null }).send(res);

const googleLogin = asyncHandler(async (req, res) => {
  const identity = await google.verifyIdToken(req.body.idToken);
  let user = await User.findOne({ googleSub: identity.sub }).select('+passwordHash +sessionVersion');
  if (user && user.email !== identity.email) {
    throw ApiError.conflict('Google account email changed; contact support to update your account');
  }
  if (!user) {
    user = await User.findOne({ email: identity.email }).select('+passwordHash +sessionVersion');
    if (user?.googleSub && user.googleSub !== identity.sub) {
      throw ApiError.conflict('Email is already linked to another Google account');
    }
    if (user) {
      if (user.status !== 'active') throw ApiError.forbidden('Account disabled');
      if (!identity.authoritative) {
        await otp.issue(user, 'google_link');
        const linkToken = jwt.sign({ kind: 'google-link', userId: String(user._id),
          googleSub: identity.sub, email: identity.email }, env.jwt.accessSecret, { expiresIn: '5m' });
        return new ApiResponse(202, { linkRequired: true, email: identity.email, linkToken },
          'Verify this email to link the Google account').send(res);
      }
      if (!user.hasVerifiedEmail()) user.passwordHash = undefined;
      user.googleSub = identity.sub;
      user.emailVerificationRequired = true;
      user.emailVerifiedAt = new Date();
      await user.save();
    } else {
      user = await User.create({ name: identity.name, email: identity.email,
        googleSub: identity.sub, avatarUrl: identity.picture,
        emailVerificationRequired: true, emailVerifiedAt: new Date() });
    }
  }
  if (user.status !== 'active') throw ApiError.forbidden('Account disabled');
  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);
  return new ApiResponse(200, { user: user.toSafeJSON(), accessToken }, 'Logged in with Google').send(res);
});

const googleLink = asyncHandler(async (req, res) => {
  let proof;
  try { proof = jwt.verify(req.body.linkToken, env.jwt.accessSecret); }
  catch { throw ApiError.badRequest('Google link session expired'); }
  if (proof.kind !== 'google-link' || !proof.userId || !proof.googleSub || !proof.email) {
    throw ApiError.badRequest('Invalid Google link session');
  }
  const user = await User.findOne({ _id: proof.userId, email: proof.email,
    status: 'active' }).select('+passwordHash +sessionVersion');
  if (!user || (user.googleSub && user.googleSub !== proof.googleSub)) {
    throw ApiError.badRequest('Google link session unavailable');
  }
  await otp.consume(user, 'google_link', req.body.code);
  if (!user.hasVerifiedEmail()) user.passwordHash = undefined;
  user.googleSub = proof.googleSub;
  user.emailVerificationRequired = true;
  user.emailVerifiedAt = new Date();
  await user.save();
  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);
  return new ApiResponse(200, { user: user.toSafeJSON(), accessToken }, 'Google account linked').send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.jwt.refreshCookieName];
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = tokenService.verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token invalid or expired, please log in again');
  }

  const stored = await RefreshToken.findOne({ tokenHash: tokenService.hashToken(token) });
  if (!stored || stored.revoked) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session no longer valid, please log in again');
  }

  const user = await User.findById(payload.sub).select('+sessionVersion');
  if (!user || user.status !== 'active' || !user.hasVerifiedEmail()) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('User no longer exists');
  }

  const { accessToken, refreshToken } = await tokenService.rotateRefreshToken(
    token,
    user,
    req.headers['user-agent']
  );
  setRefreshCookie(res, refreshToken);

  return new ApiResponse(200, { accessToken }, 'Token refreshed').send(res);
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.jwt.refreshCookieName];
  if (token) await tokenService.revokeRefreshToken(token);
  clearRefreshCookie(res);
  return new ApiResponse(200, null, 'Logged out').send(res);
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');
  return new ApiResponse(200, { user: user.toSafeJSON() }).send(res);
});

module.exports = { register, resendVerification, verifyEmail, login, requestLoginOtp, loginWithOtp,
  forgotPassword, verifyResetOtp, resetPassword, googleConfig, googleLogin, googleLink,
  refresh, logout, me };

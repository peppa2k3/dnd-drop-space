const User = require('../models/User');
const tokenService = require('../services/token.service');
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

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);

  return new ApiResponse(201, { user: user.toSafeJSON(), accessToken }, 'Account created').send(res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);

  return new ApiResponse(200, { user: user.toSafeJSON(), accessToken }, 'Logged in').send(res);
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

  const RefreshToken = require('../models/RefreshToken');
  const stored = await RefreshToken.findOne({ tokenHash: tokenService.hashToken(token) });
  if (!stored || stored.revoked) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session no longer valid, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
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

module.exports = { register, login, refresh, logout, me };

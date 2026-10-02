const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const tokenService = require('../services/token.service');
const User = require('../models/User');

/**
 * Verifies the short-lived access token sent as `Authorization: Bearer <token>`.
 * On success attaches `req.userId` (string) which every subsequent query
 * uses to scope data to the authenticated user - this is what guarantees
 * "each user only sees their own data".
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, headerToken] = header.split(' ');

  // Regular API calls (via the axios client) always send the header. The
  // query param fallback exists only so <img>/<video>/<a download> tags -
  // which cannot attach an Authorization header - can still hit protected
  // media endpoints (thumbnail/stream/download) using the same short-lived
  // access token the app already holds in memory.
  const token = scheme === 'Bearer' && headerToken ? headerToken : req.query.token;

  if (!token) {
    throw ApiError.unauthorized('Missing or malformed access token');
  }

  let payload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    );
  }

  const userExists = await User.exists({ _id: payload.sub });
  if (!userExists) throw ApiError.unauthorized('User no longer exists');

  req.userId = payload.sub;
  next();
});

module.exports = { authenticate };

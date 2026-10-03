const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const client = new OAuth2Client();
async function verifyIdToken(idToken) {
  if (!env.google.clientId) throw new ApiError(503, 'Google login is not configured');
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch { throw ApiError.unauthorized('Invalid Google identity token'); }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw ApiError.unauthorized('Verified Google email required');
  }
  const picture = typeof payload.picture === 'string' &&
    payload.picture.startsWith('https://lh3.googleusercontent.com/') && payload.picture.length < 2048
    ? payload.picture : null;
  return { sub: payload.sub, email: payload.email.trim().toLowerCase(), picture,
    name: (payload.name || payload.email.split('@')[0]).slice(0, 100),
    authoritative: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd) };
}
module.exports = { verifyIdToken };

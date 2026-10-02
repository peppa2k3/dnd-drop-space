const mongoose = require('mongoose');

/**
 * We store a hash of every issued refresh token so that:
 *  - logout can revoke a single session
 *  - refresh tokens can be rotated (old one invalidated when a new one is issued)
 *  - a stolen-but-unused token can be detected/revoked if reuse is attempted
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: null },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB TTL index: automatically removes documents once expiresAt has passed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

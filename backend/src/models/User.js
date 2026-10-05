const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    sessionVersion: { type: Number, default: 0, select: false },
    emailVerificationRequired: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    googleSub: { type: String, unique: true, sparse: true },
    storageLimitBytes: { type: Number, default: 0, min: 0 },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true,
      default: function () { return `user_${this._id}`; } },
    bio: { type: String, default: '', maxlength: 500 },
    appearance: {
      type: new mongoose.Schema({
        theme: { type: String, enum: ['cyber-blue', 'neon-storage', 'deep-purple', 'space-terminal', 'ice-data', 'ice-datacenter'], required: true },
        mode: { type: String, enum: ['dark', 'light', 'system'], required: true },
      }, { _id: false }),
      default: undefined,
    },
    avatarObjectKey: { type: String, default: null },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.hasVerifiedEmail = function hasVerifiedEmail() {
  return !this.emailVerificationRequired || Boolean(this.emailVerifiedAt);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    username: this.username || '',
    bio: this.bio || '',
    appearance: this.appearance || { theme: 'cyber-blue', mode: 'dark' },
    role: this.role,
    status: this.status,
    emailVerified: this.hasVerifiedEmail(),
    storageLimitBytes: this.storageLimitBytes,
    avatarUrl: this.avatarObjectKey ? `/api/users/${this._id}/avatar?v=${this.updatedAt.getTime()}` : this.avatarUrl,
    createdAt: this.createdAt,
  };
};

userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
};

module.exports = mongoose.model('User', userSchema);

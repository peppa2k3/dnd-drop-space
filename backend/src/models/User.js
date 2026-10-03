const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    sessionVersion: { type: Number, default: 0, select: false },
    storageLimitBytes: { type: Number, default: 0, min: 0 },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true,
      default: function () { return `user_${this._id}`; } },
    bio: { type: String, default: '', maxlength: 500 },
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
      required: true,
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
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    username: this.username || '',
    bio: this.bio || '',
    role: this.role,
    status: this.status,
    storageLimitBytes: this.storageLimitBytes,
    avatarUrl: this.avatarObjectKey ? `/api/users/${this._id}/avatar?v=${this.updatedAt.getTime()}` : null,
    createdAt: this.createdAt,
  };
};

userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
};

module.exports = mongoose.model('User', userSchema);

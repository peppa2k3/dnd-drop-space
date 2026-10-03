const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentShare: { type: mongoose.Schema.Types.ObjectId, ref: 'FileShare', default: null },
  targetType: { type: String, enum: ['user', 'group'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true },
  canView: { type: Boolean, default: true },
  canDownload: { type: Boolean, default: true },
  canReshare: { type: Boolean, default: false },
  passwordHash: { type: String, select: false, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ item: 1, createdBy: 1, targetType: 1, target: 1 }, { unique: true });
schema.index({ targetType: 1, target: 1, _id: -1 });
schema.index({ parentShare: 1 });
schema.index({ owner: 1, item: 1 });
module.exports = mongoose.model('FileShare', schema);

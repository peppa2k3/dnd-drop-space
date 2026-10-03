const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
}, { timestamps: true });
schema.index({ group: 1, target: 1 }, { unique: true });
schema.index({ target: 1, status: 1 });
module.exports = mongoose.model('GroupInvitation', schema);

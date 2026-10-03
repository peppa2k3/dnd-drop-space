const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  pairKey: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
}, { timestamps: true });
schema.index({ users: 1, status: 1 });
module.exports = mongoose.model('Friendship', schema);

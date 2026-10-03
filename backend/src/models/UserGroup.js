const mongoose = require('mongoose');
const member = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], required: true },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });
const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, trim: true, required: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  discoverable: { type: Boolean, default: true },
  members: [member],
}, { timestamps: true });
schema.index({ 'members.user': 1 });
schema.index({ discoverable: 1, name: 1 });
module.exports = mongoose.model('UserGroup', schema);

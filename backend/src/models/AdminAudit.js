const mongoose = require('mongoose');
module.exports = mongoose.model('AdminAudit', new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  changes: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));

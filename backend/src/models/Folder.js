const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: 120,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    color: { type: String, default: null },
  },
  { timestamps: true }
);

// A user cannot have two sibling folders with the same name under the same parent.
folderSchema.index({ user: 1, parent: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);

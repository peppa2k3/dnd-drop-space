const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    color: { type: String, default: '#C89B3C' },
  },
  { timestamps: true }
);

tagSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', tagSchema);

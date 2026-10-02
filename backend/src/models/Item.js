const mongoose = require('mongoose');

/**
 * Design note:
 * Notes, URL bookmarks and every kind of uploaded file (image, video, pdf,
 * word, excel, archive, anything else) all share the same "envelope":
 * title, description, folder, tags, favorite, createdAt/updatedAt, trash
 * state. Modeling them as a single `Item` collection (instead of three+
 * separate collections) is what makes folder browsing, tagging, global
 * search, favorites and trash work identically for every data type with
 * one set of endpoints instead of duplicating that logic per type.
 *
 * `type` is the coarse kind used by most of the app: note | url | file.
 * `fileMeta.category` further breaks a `file` down into image / video /
 * pdf / word / excel / archive / other, which is what the dashboard and
 * the per-category pages (Images, Videos, Files) filter on.
 */

const FILE_CATEGORIES = ['image', 'video', 'pdf', 'word', 'excel', 'archive', 'other'];

const itemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['note', 'url', 'file'],
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '', maxlength: 5000 },

    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag', index: true }],

    favorite: { type: Boolean, default: false, index: true },
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },

    // ----- type: note -----
    noteContent: {
      format: { type: String, enum: ['markdown'], default: 'markdown' },
      content: { type: String, default: '' },
    },

    // ----- type: url -----
    urlMeta: {
      url: { type: String, default: null },
      siteName: { type: String, default: null },
      ogTitle: { type: String, default: null },
      ogDescription: { type: String, default: null },
      favicon: { type: String, default: null },
      // Either a remote thumbnail URL, or an internal proxy path
      // (/api/items/:id/thumbnail) when we mirrored the image into MinIO.
      thumbnailUrl: { type: String, default: null },
      thumbnailObjectKey: { type: String, default: null },
    },

    // ----- type: file (image, video, pdf, word, excel, archive, other) -----
    fileMeta: {
      // Notes/bookmarks have no file category; Mongoose 7 requires explicit null.
      category: { type: String, enum: [...FILE_CATEGORIES, null], default: null },
      originalName: { type: String, default: null },
      extension: { type: String, default: null },
      mimeType: { type: String, default: null },
      size: { type: Number, default: 0 }, // bytes
      bucket: { type: String, default: null },
      objectKey: { type: String, default: null },
      thumbnailObjectKey: { type: String, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      durationSeconds: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

// Common list/filter access patterns.
itemSchema.index({ user: 1, isTrashed: 1, type: 1, createdAt: -1 });
itemSchema.index({ user: 1, isTrashed: 1, favorite: 1 });
itemSchema.index({ user: 1, isTrashed: 1, folder: 1 });
itemSchema.index({ user: 1, isTrashed: 1, 'fileMeta.category': 1 });

itemSchema.statics.FILE_CATEGORIES = FILE_CATEGORIES;

module.exports = mongoose.model('Item', itemSchema);

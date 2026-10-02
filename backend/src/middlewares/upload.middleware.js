const multer = require('multer');
const env = require('../config/env');

/**
 * Files are buffered in memory (not written to local disk) since they get
 * streamed straight to MinIO right after. This keeps the API container
 * stateless and avoids cleaning up temp files. For a personal-scale app
 * this is simpler and fast enough; very large files could later switch to
 * multer's disk storage + streaming upload if needed.
 *
 * No mimetype filter is applied on purpose: the spec asks for "File bất
 * kỳ" (any file at all) to be storable.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploads.maxFileSizeBytes,
    files: env.uploads.maxFilesPerUpload,
  },
});

module.exports = upload;

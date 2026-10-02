const express = require('express');
const itemController = require('../controllers/item.controller');
const uploadController = require('../controllers/upload.controller');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const env = require('../config/env');
const {
  createNoteSchema,
  updateNoteContentSchema,
  createUrlSchema,
  updateItemSchema,
  uploadMetaSchema,
} = require('../validators/item.validator');

const router = express.Router();

// ---- static-prefix routes first, so they never get swallowed by /:id ----
router.get('/', itemController.list);

router.post('/note', validate(createNoteSchema), itemController.createNote);
router.post('/url', validate(createUrlSchema), itemController.createUrl);

router.post(
  '/upload',
  upload.array('files', env.uploads.maxFilesPerUpload),
  validate(uploadMetaSchema),
  uploadController.uploadFiles
);

// ---- single-item routes ----
router.get('/:id', itemController.getOne);
router.patch('/:id', validate(updateItemSchema), itemController.update);
router.patch('/:id/note', validate(updateNoteContentSchema), itemController.updateNoteContent);
router.patch('/:id/favorite', itemController.toggleFavorite);

router.get('/:id/download', uploadController.downloadFile);
router.get('/:id/thumbnail', uploadController.getThumbnail);
router.get('/:id/stream', uploadController.streamFile);

router.delete('/:id', itemController.moveToTrash); // soft delete -> Trash
router.post('/:id/restore', itemController.restoreFromTrash);
router.delete('/:id/permanent', itemController.permanentlyDelete);

module.exports = router;

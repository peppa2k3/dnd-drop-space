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
const ownedFolder = require('../middlewares/ownedFolder.middleware');
const { requireStorage } = require('../middlewares/auth.middleware');

// ---- static-prefix routes first, so they never get swallowed by /:id ----
router.get('/', itemController.list);

router.post('/note', requireStorage, validate(createNoteSchema), ownedFolder, itemController.createNote);
router.post('/url', requireStorage, validate(createUrlSchema), ownedFolder, itemController.createUrl);

router.post(
  '/upload',
  requireStorage,
  upload.array('files', env.uploads.maxFilesPerUpload),
  validate(uploadMetaSchema),
  ownedFolder,
  uploadController.uploadFiles
);

// ---- single-item routes ----
router.get('/:id', itemController.getOne);
router.patch('/:id', validate(updateItemSchema), ownedFolder, itemController.update);
router.patch('/:id/note', requireStorage, validate(updateNoteContentSchema), itemController.updateNoteContent);
router.patch('/:id/favorite', itemController.toggleFavorite);

router.get('/:id/download', uploadController.downloadFile);
router.get('/:id/thumbnail', uploadController.getThumbnail);
router.get('/:id/stream', uploadController.streamFile);

router.delete('/:id', itemController.moveToTrash); // soft delete -> Trash
router.post('/:id/restore', itemController.restoreFromTrash);
router.delete('/:id/permanent', itemController.permanentlyDelete);

module.exports = router;

const express = require('express');
const folderController = require('../controllers/folder.controller');
const validate = require('../middlewares/validate.middleware');
const { createFolderSchema, updateFolderSchema } = require('../validators/folder.validator');

const router = express.Router();

router.get('/', folderController.list);
router.post('/', validate(createFolderSchema), folderController.create);
router.patch('/:id', validate(updateFolderSchema), folderController.update);
router.delete('/:id', folderController.remove);

module.exports = router;

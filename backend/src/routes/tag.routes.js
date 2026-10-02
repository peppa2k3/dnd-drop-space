const express = require('express');
const tagController = require('../controllers/tag.controller');
const validate = require('../middlewares/validate.middleware');
const { createTagSchema, updateTagSchema } = require('../validators/tag.validator');

const router = express.Router();

router.get('/', tagController.list);
router.post('/', validate(createTagSchema), tagController.create);
router.patch('/:id', validate(updateTagSchema), tagController.update);
router.delete('/:id', tagController.remove);

module.exports = router;

const express = require('express');
const itemController = require('../controllers/item.controller');
const trashController = require('../controllers/trash.controller');

const router = express.Router();

// Reuses the same list/filter/sort/pagination logic as /api/items, just
// forced to only ever show trashed items - one implementation, one set of
// filters, instead of a second parallel "list trash" query to maintain.
router.get('/', (req, res, next) => {
  req.query.isTrashed = 'true';
  next();
}, itemController.list);

router.delete('/', trashController.emptyTrash);

module.exports = router;

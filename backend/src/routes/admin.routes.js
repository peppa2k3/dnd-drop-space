const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/admin.controller');
const validate = require('../middlewares/validate.middleware');
const { requireAdmin } = require('../middlewares/auth.middleware');
const { adminUserSchema, pageSchema, idSchema } = require('../validators/user.validator');
const router = express.Router();
router.use(requireAdmin);
router.use('/collaboration', require('./adminCollaboration.routes'));
router.get('/users', validate(pageSchema, 'query'), controller.listUsers);
router.patch('/users/:id', validate(idSchema, 'params'), validate(adminUserSchema), controller.updateUser);
router.get('/users/:id/files', validate(idSchema, 'params'), validate(pageSchema, 'query'), controller.listFiles);
router.get('/users/:id/audit', validate(idSchema, 'params'), validate(pageSchema, 'query'), controller.audit);
router.patch('/users/:id/files/:itemId',
  validate(idSchema.extend({ itemId: z.string().regex(/^[a-f\d]{24}$/i) }), 'params'),
  validate(z.object({ isTrashed: z.boolean() }).strict()), controller.fileAction);
const fileParams = idSchema.extend({ itemId: z.string().regex(/^[a-f\d]{24}$/i) });
router.delete('/users/:id/files/:itemId', validate(fileParams, 'params'), controller.deleteFile);
router.get('/users/:id/files/:itemId/download', validate(fileParams, 'params'), (req, res, next) => {
  // The explicit admin endpoint is the only route allowed to change owner scope.
  req.userId = req.params.id;
  req.params.id = req.params.itemId;
  next();
}, require('../controllers/upload.controller').downloadFile);
module.exports = router;

const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;

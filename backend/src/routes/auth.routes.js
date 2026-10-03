const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, emailSchema, codeSchema, passwordResetSchema, googleSchema, googleLinkSchema } = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/email/resend', authLimiter, validate(emailSchema), authController.resendVerification);
router.post('/email/verify', authLimiter, validate(codeSchema), authController.verifyEmail);
router.post('/login/otp/request', authLimiter, validate(emailSchema), authController.requestLoginOtp);
router.post('/login/otp/verify', authLimiter, validate(codeSchema), authController.loginWithOtp);
router.post('/password/forgot', authLimiter, validate(emailSchema), authController.forgotPassword);
router.post('/password/verify', authLimiter, validate(codeSchema), authController.verifyResetOtp);
router.post('/password/reset', authLimiter, validate(passwordResetSchema), authController.resetPassword);
router.get('/google/config', authController.googleConfig);
router.post('/google', authLimiter, validate(googleSchema), authController.googleLogin);
router.post('/google/link', authLimiter, validate(googleLinkSchema), authController.googleLink);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;

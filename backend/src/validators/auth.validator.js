const { z } = require('zod');
const env = require('../config/env');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email() }).strict();
const otpCodeSchema = z.string().regex(new RegExp(`^\\d{${env.otp.length}}$`), 'Invalid verification code');
const codeSchema = emailSchema.extend({ code: otpCodeSchema });
const passwordResetSchema = emailSchema.extend({
  resetToken: z.string().regex(/^[a-f0-9]{24}\.[a-f0-9]{64}$/),
  password: z.string().min(8).max(128),
});
const googleSchema = z.object({ idToken: z.string().min(100).max(8192) }).strict();
const googleLinkSchema = z.object({ linkToken: z.string().min(100).max(2048),
  code: otpCodeSchema }).strict();

module.exports = { registerSchema, loginSchema, emailSchema, codeSchema, passwordResetSchema, googleSchema, googleLinkSchema };

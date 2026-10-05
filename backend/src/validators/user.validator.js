const { z } = require('zod');

const profileFields = {
  name: z.string().trim().min(2).max(100).optional(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,32}$/).optional(),
  bio: z.string().trim().max(500).optional(),
};
const appearanceSchema = z.object({
  theme: z.enum(['cyber-blue', 'neon-storage', 'deep-purple', 'space-terminal', 'ice-data', 'ice-datacenter']),
  mode: z.enum(['dark', 'light', 'system']),
}).strict();
const profileSchema = z.object({
  ...profileFields,
  appearance: appearanceSchema.optional(),
  language: z.enum(['vi', 'en', 'zh-CN', 'ja', 'ko', 'fr', 'de', 'it', 'es']).optional(),
}).strict();
const adminUserSchema = z.object({
  ...profileFields,
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  storageLimitBytes: z.number().int().min(0).max(1024 ** 5).optional(),
}).strict();
const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  q: z.string().trim().max(100).default(''),
});
const idSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) });
module.exports = { profileSchema, adminUserSchema, pageSchema, idSchema };

const { z } = require('zod');
const id = z.string().regex(/^[0-9a-fA-F]{24}$/);
const search = z.object({ q: z.string().trim().max(100).default('') });
const friendRequest = z.object({ userId: id }).strict();
const friendDecision = z.object({ action: z.enum(['accept', 'reject', 'cancel']) }).strict();
const groupCreate = z.object({
  name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).default(''),
  discoverable: z.boolean().default(true),
}).strict();
const groupUpdate = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(), discoverable: z.boolean().optional(),
}).strict();
const groupInvite = z.object({ userId: id }).strict();
const invitationDecision = z.object({ action: z.enum(['accept', 'reject']) }).strict();
const memberRole = z.object({ role: z.enum(['ADMIN', 'MEMBER']) }).strict();
const shareCreate = z.object({
  itemId: id, targetType: z.enum(['user', 'group']), targetId: id,
  canView: z.boolean().default(true), canDownload: z.boolean().default(true),
  canReshare: z.boolean().default(false),
  password: z.string().min(6).max(128).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  sourceShareId: id.optional(), sourcePassword: z.string().optional(),
}).strict().refine((input) => input.canView || input.canDownload || input.canReshare,
  'Choose at least one permission');
const shareUpdate = z.object({
  canView: z.boolean().optional(), canDownload: z.boolean().optional(),
  canReshare: z.boolean().optional(), password: z.string().min(6).max(128).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
}).strict();
const unlock = z.object({ password: z.string().min(1) }).strict();
const fileId = z.object({ id });
const page = z.object({ cursor: id.optional() });
module.exports = { id, search, friendRequest, friendDecision, groupCreate, groupUpdate,
  groupInvite, invitationDecision, memberRole, shareCreate, shareUpdate, unlock, fileId, page };

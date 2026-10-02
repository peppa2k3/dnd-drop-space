const { z } = require('zod');

const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50),
  color: z.string().max(20).optional(),
});

const updateTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50).optional(),
  color: z.string().max(20).optional(),
});

module.exports = { createTagSchema, updateTagSchema };

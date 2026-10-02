const { z } = require('zod');

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(120),
  parent: objectId.nullable().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(120).optional(),
  parent: objectId.nullable().optional(),
  color: z.string().max(20).nullable().optional(),
});

module.exports = { createFolderSchema, updateFolderSchema };

const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Tags are accepted as plain names (not ids) so the UI can let people type
// a brand new tag and have it created on the fly, instead of requiring a
// separate "create tag" step before it can be attached to an item.
const tagsField = z.array(z.string().trim().min(1).max(50)).max(30).optional();

const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().max(5000).optional(),
  content: z.string().max(500000).optional(),
  folder: objectId.nullable().optional(),
  tags: tagsField,
  favorite: z.boolean().optional(),
});

const updateNoteContentSchema = z.object({
  content: z.string().max(500000),
});

const createUrlSchema = z.object({
  url: z.string().trim().url('A valid URL is required'),
  title: z.string().trim().max(300).optional(),
  description: z.string().max(5000).optional(),
  folder: objectId.nullable().optional(),
  tags: tagsField,
  favorite: z.boolean().optional(),
});

const updateItemSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  folder: objectId.nullable().optional(),
  tags: tagsField,
  favorite: z.boolean().optional(),
});

const uploadMetaSchema = z.object({
  folder: objectId.nullable().optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (Array.isArray(v)) return v;
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [v];
      } catch {
        return [v];
      }
    }),
  description: z.string().max(5000).optional(),
});

module.exports = {
  createNoteSchema,
  updateNoteContentSchema,
  createUrlSchema,
  updateItemSchema,
  uploadMetaSchema,
};

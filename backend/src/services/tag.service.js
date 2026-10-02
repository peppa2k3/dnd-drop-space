const Tag = require('../models/Tag');

/**
 * Given a list of raw tag names typed by the user, returns the matching
 * Tag ObjectIds - creating any tag that doesn't exist yet for this user.
 * Lets the UI offer a single "type to add a tag" input without a separate
 * tag-management step first.
 */
async function findOrCreateTagIds(userId, tagNames = []) {
  const normalized = [...new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return [];

  const existing = await Tag.find({ user: userId, name: { $in: normalized } });
  const existingNames = new Set(existing.map((t) => t.name));
  const toCreate = normalized.filter((name) => !existingNames.has(name));

  const created = toCreate.length
    ? await Tag.insertMany(toCreate.map((name) => ({ user: userId, name })))
    : [];

  return [...existing, ...created].map((t) => t._id);
}

module.exports = { findOrCreateTagIds };

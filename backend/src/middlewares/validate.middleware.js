const ApiError = require('../utils/ApiError');

/**
 * Validates req.body (default) or another request part against a Zod
 * schema. On failure, throws a 400 ApiError with field-level details so
 * the frontend can highlight the exact invalid fields.
 *
 * Usage: router.post('/', validate(createItemSchema), controller.create)
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(ApiError.badRequest('Validation failed', errors));
  }

  req[source] = result.data;
  next();
};

module.exports = validate;

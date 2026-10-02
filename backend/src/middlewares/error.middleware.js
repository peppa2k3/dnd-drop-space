const multer = require('multer');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'One or more files exceed the maximum upload size' : err.message;
      error = ApiError.badRequest(message);
    } else if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
      error = ApiError.badRequest('Validation failed', errors);
    } else if (err instanceof mongoose.Error.CastError) {
      error = ApiError.badRequest(`Invalid value for field "${err.path}"`);
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {}).join(', ') || 'field';
      error = ApiError.conflict(`A record with this ${field} already exists`);
    } else {
      error = ApiError.internal(env.isProduction ? 'Something went wrong' : err.message);
    }
  }

  if (error.statusCode >= 500) {
    logger.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };

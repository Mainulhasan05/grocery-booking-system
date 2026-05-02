'use strict';

/**
 * src/middlewares/validate.middleware.js
 *
 * Runs express-validator's validationResult and short-circuits
 * with a 422 response if any validation errors exist.
 */

const { validationResult } = require('express-validator');
const { error } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return error(
      res,
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      extractedErrors
    );
  }

  next();
};

module.exports = validate;

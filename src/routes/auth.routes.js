'use strict';

/**
 * src/routes/auth.routes.js
 *
 * Authentication routes — register and login.
 * No auth middleware required (public endpoints).
 */

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const validate = require('../middlewares/validate.middleware');

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

module.exports = router;

'use strict';

/**
 * src/routes/user/grocery.routes.js
 *
 * User grocery browsing routes — authenticated users only.
 */

const { Router } = require('express');
const controller = require('../../controllers/user/grocery.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate, authorize(ROLES.USER));

router.get('/', controller.getAll);

module.exports = router;

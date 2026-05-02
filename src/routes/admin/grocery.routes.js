'use strict';

/**
 * src/routes/admin/grocery.routes.js
 *
 * Admin grocery management routes.
 * All routes require authentication + admin role.
 */

const { Router } = require('express');
const controller = require('../../controllers/admin/grocery.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createGroceryValidator,
  updateGroceryValidator,
  updateInventoryValidator,
} = require('../../validators/grocery.validator');
const { ROLES } = require('../../utils/constants');

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize(ROLES.ADMIN));

router.post('/', createGroceryValidator, validate, controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.put('/:id', updateGroceryValidator, validate, controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/inventory', updateInventoryValidator, validate, controller.updateInventory);

module.exports = router;

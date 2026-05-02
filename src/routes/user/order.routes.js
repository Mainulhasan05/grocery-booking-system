'use strict';

/**
 * src/routes/user/order.routes.js
 *
 * User order routes — place orders and view order history.
 */

const { Router } = require('express');
const controller = require('../../controllers/user/order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { placeOrderValidator } = require('../../validators/order.validator');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate, authorize(ROLES.USER));

router.post('/', placeOrderValidator, validate, controller.placeOrder);
router.get('/', controller.getOrders);
router.get('/:id', controller.getOrderById);

module.exports = router;

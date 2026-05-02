'use strict';

/**
 * src/routes/index.js — Master Router
 *
 * Mounts all sub-routers under the /api/v1 prefix.
 */

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const adminGroceryRoutes = require('./admin/grocery.routes');
const userGroceryRoutes = require('./user/grocery.routes');
const userOrderRoutes = require('./user/order.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/groceries', adminGroceryRoutes);
router.use('/user/groceries', userGroceryRoutes);
router.use('/user/orders', userOrderRoutes);

module.exports = router;

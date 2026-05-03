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

/**
 * @swagger
 * /user/orders:
 *   post:
 *     tags: [User — Orders]
 *     summary: Place a new order
 *     description: |
 *       Creates an order atomically inside a database transaction.
 *       Steps: validate items → check stock → snapshot prices → create order → decrement inventory → commit.
 *       Rate limited to 10 requests per 15-minute window.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [grocery_item_id, quantity]
 *                   properties:
 *                     grocery_item_id:
 *                       type: string
 *                       format: uuid
 *                       example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *           example:
 *             items:
 *               - grocery_item_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                 quantity: 2
 *               - grocery_item_id: b2c3d4e5-f6a7-8901-bcde-f12345678901
 *                 quantity: 1
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order placed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Items unavailable or insufficient stock
 *       404:
 *         description: One or more grocery items not found
 *       422:
 *         description: Validation failed
 *       429:
 *         description: Too many order attempts
 */
router.post('/', placeOrderValidator, validate, controller.placeOrder);

/**
 * @swagger
 * /user/orders:
 *   get:
 *     tags: [User — Orders]
 *     summary: Get order history
 *     description: Returns the authenticated user's orders with line items and grocery item names.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', controller.getOrders);

/**
 * @swagger
 * /user/orders/{id}:
 *   get:
 *     tags: [User — Orders]
 *     summary: Get a single order by ID
 *     description: Returns 404 (not 403) for orders belonging to other users to avoid leaking existence.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', controller.getOrderById);

module.exports = router;

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

/**
 * @swagger
 * /user/groceries:
 *   get:
 *     tags: [User — Grocery Browsing]
 *     summary: Browse available grocery items
 *     description: Returns only active, in-stock grocery items. The is_active field is excluded from the response.
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by item name (case-insensitive)
 *     responses:
 *       200:
 *         description: Available grocery items retrieved
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GroceryItem'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User role required
 */
router.get('/', controller.getAll);

module.exports = router;

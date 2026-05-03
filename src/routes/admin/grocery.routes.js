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

/**
 * @swagger
 * /admin/groceries:
 *   post:
 *     tags: [Admin — Grocery Management]
 *     summary: Create a new grocery item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Organic Bananas
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 3.99
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 100
 *               description:
 *                 type: string
 *                 example: Fresh organic bananas, bunch of 6
 *     responses:
 *       201:
 *         description: Grocery item created successfully
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
 *                   example: Grocery item created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     item:
 *                       $ref: '#/components/schemas/GroceryItem'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       409:
 *         description: Grocery item name already exists
 *       422:
 *         description: Validation failed
 */
router.post('/', createGroceryValidator, validate, controller.create);

/**
 * @swagger
 * /admin/groceries:
 *   get:
 *     tags: [Admin — Grocery Management]
 *     summary: List all grocery items (including inactive)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search items by name (case-insensitive)
 *     responses:
 *       200:
 *         description: Grocery items retrieved successfully
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
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /admin/groceries/{id}:
 *   get:
 *     tags: [Admin — Grocery Management]
 *     summary: Get a single grocery item by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Grocery item UUID
 *     responses:
 *       200:
 *         description: Grocery item retrieved successfully
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
 *                     item:
 *                       $ref: '#/components/schemas/GroceryItem'
 *       404:
 *         description: Grocery item not found
 */
router.get('/:id', controller.getOne);

/**
 * @swagger
 * /admin/groceries/{id}:
 *   put:
 *     tags: [Admin — Grocery Management]
 *     summary: Update a grocery item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Organic Bananas (Updated)
 *               price:
 *                 type: number
 *                 example: 4.49
 *               quantity:
 *                 type: integer
 *                 example: 150
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grocery item updated successfully
 *       404:
 *         description: Grocery item not found
 *       409:
 *         description: Name conflict with existing item
 *       422:
 *         description: Validation failed
 */
router.put('/:id', updateGroceryValidator, validate, controller.update);

/**
 * @swagger
 * /admin/groceries/{id}:
 *   delete:
 *     tags: [Admin — Grocery Management]
 *     summary: Soft-delete a grocery item (set inactive)
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
 *         description: Grocery item deleted (deactivated) successfully
 *       400:
 *         description: Item is already inactive
 *       404:
 *         description: Grocery item not found
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /admin/groceries/{id}/inventory:
 *   patch:
 *     tags: [Admin — Grocery Management]
 *     summary: Update inventory level for a grocery item
 *     description: Sets the absolute inventory quantity. Uses row-level locking to prevent race conditions with concurrent orders.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 200
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       404:
 *         description: Grocery item not found
 *       422:
 *         description: Validation failed
 */
router.patch('/:id/inventory', updateInventoryValidator, validate, controller.updateInventory);

module.exports = router;

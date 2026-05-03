'use strict';

/**
 * tests/user-order.test.js — User Order Endpoint Tests
 *
 * Tests for POST /api/v1/user/orders, GET /api/v1/user/orders,
 * and GET /api/v1/user/orders/:id.
 * Covers transactional order placement, inventory decrement, stock checks,
 * authorization, and edge cases.
 */

const request = require('supertest');
const app = require('../src/app');
const { GroceryItem } = require('../src/models');
const { setupDatabase, teardownDatabase } = require('./setup');
const { createTestUser, createTestAdmin, createTestGroceryItem } = require('./helpers');

let userToken;
let userId;
let adminToken;
let banana;
let apple;
let inactiveItem;

beforeAll(async () => {
  await setupDatabase();

  const user = await createTestUser();
  userToken = user.token;
  userId = user.user.id;

  const admin = await createTestAdmin();
  adminToken = admin.token;

  // Create grocery items for order tests
  banana = await createTestGroceryItem({ name: 'Order Banana', price: 2.50, quantity: 10 });
  apple = await createTestGroceryItem({ name: 'Order Apple', price: 3.00, quantity: 5 });
  inactiveItem = await createTestGroceryItem({ name: 'Discontinued Milk', price: 1.99, quantity: 50, is_active: false });
});

afterAll(async () => {
  await teardownDatabase();
});

// ─── PLACE ORDER ─────────────────────────────────────────────────
describe('POST /api/v1/user/orders', () => {
  it('should place an order successfully with valid items', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [
          { grocery_item_id: banana.id, quantity: 2 },
          { grocery_item_id: apple.id, quantity: 1 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Order placed successfully');
    expect(res.body.data.order).toHaveProperty('id');
    expect(res.body.data.order.status).toBe('confirmed');
    // Total = (2 * 2.50) + (1 * 3.00) = 8.00
    expect(parseFloat(res.body.data.order.total_amount)).toBe(8.00);
    expect(res.body.data.order.items).toHaveLength(2);
  });

  it('should decrement inventory after order placement', async () => {
    // Banana started at 10, ordered 2 → should be 8
    const updatedBanana = await GroceryItem.scope('withInactive').findByPk(banana.id);
    expect(updatedBanana.quantity).toBe(8);

    // Apple started at 5, ordered 1 → should be 4
    const updatedApple = await GroceryItem.scope('withInactive').findByPk(apple.id);
    expect(updatedApple.quantity).toBe(4);
  });

  it('should snapshot the price at order time (unit_price in order items)', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: banana.id, quantity: 1 }],
      });

    expect(res.status).toBe(201);
    const orderItem = res.body.data.order.items[0];
    expect(parseFloat(orderItem.unit_price)).toBe(2.50);
  });

  it('should reject order with insufficient stock', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: apple.id, quantity: 999 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient stock');
  });

  it('should reject order with inactive (soft-deleted) items', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: inactiveItem.id, quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('no longer available');
  });

  it('should reject order with non-existent item ID', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: 1 }],
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });

  it('should reject order with empty items array', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [] });

    expect(res.status).toBe(422);
  });

  it('should reject order with missing items field', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('should reject order with invalid grocery_item_id (not UUID)', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: 'not-a-uuid', quantity: 1 }],
      });

    expect(res.status).toBe(422);
  });

  it('should reject order with zero quantity', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: banana.id, quantity: 0 }],
      });

    expect(res.status).toBe(422);
  });

  it('should reject order with negative quantity', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: banana.id, quantity: -3 }],
      });

    expect(res.status).toBe(422);
  });

  it('should reject order without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .send({
        items: [{ grocery_item_id: banana.id, quantity: 1 }],
      });

    expect(res.status).toBe(401);
  });

  it('should reject order from admin role', async () => {
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ grocery_item_id: banana.id, quantity: 1 }],
      });

    expect(res.status).toBe(403);
  });
});

// ─── GET ORDERS (list) ───────────────────────────────────────────
describe('GET /api/v1/user/orders', () => {
  it('should return the user\'s order history', async () => {
    const res = await request(app)
      .get('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
    expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('total');
  });

  it('should include order items with grocery item names', async () => {
    const res = await request(app)
      .get('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const order = res.body.data.orders[0];
    expect(order).toHaveProperty('items');
    expect(order.items.length).toBeGreaterThanOrEqual(1);
    expect(order.items[0]).toHaveProperty('groceryItem');
  });

  it('should support pagination', async () => {
    const res = await request(app)
      .get('/api/v1/user/orders?page=1&limit=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.limit).toBe(1);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .get('/api/v1/user/orders');

    expect(res.status).toBe(401);
  });
});

// ─── GET ORDER BY ID ─────────────────────────────────────────────
describe('GET /api/v1/user/orders/:id', () => {
  let orderId;

  beforeAll(async () => {
    // Place an order to get an ID
    const res = await request(app)
      .post('/api/v1/user/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ grocery_item_id: banana.id, quantity: 1 }],
      });
    if (res.body.data && res.body.data.order) {
      orderId = res.body.data.order.id;
    }
  });

  it('should return a single order with items', async () => {
    const res = await request(app)
      .get(`/api/v1/user/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.order.id).toBe(orderId);
    expect(res.body.data.order).toHaveProperty('items');
  });

  it('should return 404 for non-existent order ID', async () => {
    const res = await request(app)
      .get('/api/v1/user/orders/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('should not expose another user\'s order (returns 404, not 403)', async () => {
    // Create a second user
    const otherUser = await createTestUser({
      name: 'Other User',
      email: 'other@example.com',
    });

    const res = await request(app)
      .get(`/api/v1/user/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherUser.token}`);

    // Returns 404 — not 403 — to avoid leaking existence
    expect(res.status).toBe(404);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .get(`/api/v1/user/orders/${orderId}`);

    expect(res.status).toBe(401);
  });
});

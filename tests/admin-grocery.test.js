'use strict';

/**
 * tests/admin-grocery.test.js — Admin Grocery Management Tests
 *
 * Tests for all /api/v1/admin/groceries endpoints.
 * Covers CRUD operations, authorization, validation, and edge cases.
 */

const request = require('supertest');
const app = require('../src/app');
const { setupDatabase, teardownDatabase } = require('./setup');
const { createTestUser, createTestAdmin, createTestGroceryItem } = require('./helpers');

let adminToken;
let userToken;

beforeAll(async () => {
  await setupDatabase();

  const admin = await createTestAdmin();
  adminToken = admin.token;

  const user = await createTestUser();
  userToken = user.token;
});

afterAll(async () => {
  await teardownDatabase();
});

// ─── CREATE ──────────────────────────────────────────────────────
describe('POST /api/v1/admin/groceries', () => {
  it('should create a grocery item with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Organic Apples',
        price: 5.99,
        quantity: 50,
        description: 'Fresh organic apples',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item).toHaveProperty('id');
    expect(res.body.data.item.name).toBe('Organic Apples');
    expect(res.body.data.item.is_active).toBe(true);
  });

  it('should create item with only required fields (name, price)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Milk',
        price: 2.49,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item.name).toBe('Milk');
    expect(res.body.data.item.quantity).toBe(0); // default
  });

  it('should reject duplicate item name', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Organic Apples', // already created
        price: 6.99,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing name', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 5.99 });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing price', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'No Price Item' });

    expect(res.status).toBe(422);
  });

  it('should reject negative price', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Negative Price', price: -5 });

    expect(res.status).toBe(422);
  });

  it('should reject negative quantity', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Negative Qty', price: 1, quantity: -10 });

    expect(res.status).toBe(422);
  });

  it('should reject request without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .send({ name: 'No Auth Item', price: 1.99 });

    expect(res.status).toBe(401);
  });

  it('should reject request from a regular user (wrong role)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'User Trying Admin', price: 1.99 });

    expect(res.status).toBe(403);
  });
});

// ─── READ ALL ────────────────────────────────────────────────────
describe('GET /api/v1/admin/groceries', () => {
  it('should return paginated list of items', async () => {
    const res = await request(app)
      .get('/api/v1/admin/groceries')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('totalPages');
    expect(res.body.meta).toHaveProperty('total');
  });

  it('should support pagination params', async () => {
    const res = await request(app)
      .get('/api/v1/admin/groceries?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.limit).toBe(1);
  });

  it('should support search by name', async () => {
    const res = await request(app)
      .get('/api/v1/admin/groceries?search=apple')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const names = res.body.data.items.map((i) => i.name.toLowerCase());
    names.forEach((name) => expect(name).toContain('apple'));
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .get('/api/v1/admin/groceries');

    expect(res.status).toBe(401);
  });
});

// ─── READ ONE ────────────────────────────────────────────────────
describe('GET /api/v1/admin/groceries/:id', () => {
  let itemId;

  beforeAll(async () => {
    const item = await createTestGroceryItem({ name: 'Get-One Test Item' });
    itemId = item.id;
  });

  it('should return a single item', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/groceries/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item.id).toBe(itemId);
  });

  it('should return 404 for non-existent UUID', async () => {
    const res = await request(app)
      .get('/api/v1/admin/groceries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── UPDATE ──────────────────────────────────────────────────────
describe('PUT /api/v1/admin/groceries/:id', () => {
  let itemId;

  beforeAll(async () => {
    const item = await createTestGroceryItem({ name: 'Update Test Item' });
    itemId = item.id;
  });

  it('should update item name and price', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/groceries/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Item Name', price: 9.99 });

    expect(res.status).toBe(200);
    expect(res.body.data.item.name).toBe('Updated Item Name');
  });

  it('should reject update with no fields provided', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/groceries/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('should return 404 for non-existent item', async () => {
    const res = await request(app)
      .put('/api/v1/admin/groceries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost Item' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE (soft) ───────────────────────────────────────────────
describe('DELETE /api/v1/admin/groceries/:id', () => {
  let itemId;

  beforeAll(async () => {
    const item = await createTestGroceryItem({ name: 'Delete Test Item' });
    itemId = item.id;
  });

  it('should soft-delete an active item', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/groceries/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.item.is_active).toBe(false);
  });

  it('should reject deleting an already inactive item', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/groceries/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent item', async () => {
    const res = await request(app)
      .delete('/api/v1/admin/groceries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── INVENTORY UPDATE ────────────────────────────────────────────
describe('PATCH /api/v1/admin/groceries/:id/inventory', () => {
  let itemId;

  beforeAll(async () => {
    const item = await createTestGroceryItem({ name: 'Inventory Test Item', quantity: 10 });
    itemId = item.id;
  });

  it('should update inventory quantity', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/groceries/${itemId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 200 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.item.quantity)).toBe(200);
  });

  it('should allow setting inventory to zero', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/groceries/${itemId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 0 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.item.quantity)).toBe(0);
  });

  it('should reject negative inventory', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/groceries/${itemId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: -5 });

    expect(res.status).toBe(422);
  });

  it('should reject missing quantity', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/groceries/${itemId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('should return 404 for non-existent item', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/groceries/00000000-0000-0000-0000-000000000000/inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 50 });

    expect(res.status).toBe(404);
  });
});

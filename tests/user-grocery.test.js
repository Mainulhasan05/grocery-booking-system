'use strict';

/**
 * tests/user-grocery.test.js — User Grocery Browsing Tests
 *
 * Tests for GET /api/v1/user/groceries.
 * Verifies only active, in-stock items are returned.
 */

const request = require('supertest');
const app = require('../src/app');
const { setupDatabase, teardownDatabase } = require('./setup');
const { createTestUser, createTestAdmin, createTestGroceryItem } = require('./helpers');

let userToken;
let adminToken;

beforeAll(async () => {
  await setupDatabase();

  const user = await createTestUser();
  userToken = user.token;

  const admin = await createTestAdmin();
  adminToken = admin.token;

  // Seed grocery items with varying states
  await createTestGroceryItem({ name: 'Active In-Stock', quantity: 50, is_active: true });
  await createTestGroceryItem({ name: 'Active Out-of-Stock', quantity: 0, is_active: true });
  await createTestGroceryItem({ name: 'Inactive Item', quantity: 100, is_active: false });
  await createTestGroceryItem({ name: 'Apple Juice', quantity: 30, is_active: true });
});

afterAll(async () => {
  await teardownDatabase();
});

describe('GET /api/v1/user/groceries', () => {
  it('should return only active, in-stock items', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);

    // Should NOT include inactive or out-of-stock items
    const names = res.body.data.items.map((i) => i.name);
    expect(names).toContain('Active In-Stock');
    expect(names).toContain('Apple Juice');
    expect(names).not.toContain('Active Out-of-Stock');
    expect(names).not.toContain('Inactive Item');
  });

  it('should not expose the is_active field to users', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    res.body.data.items.forEach((item) => {
      expect(item.is_active).toBeUndefined();
    });
  });

  it('should support search by name', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries?search=apple')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    res.body.data.items.forEach((item) => {
      expect(item.name.toLowerCase()).toContain('apple');
    });
  });

  it('should support pagination', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries?page=1&limit=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.limit).toBe(1);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries');

    expect(res.status).toBe(401);
  });

  it('should reject request from admin role', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/user/groceries')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });

  it('should handle search parameter pollution gracefully', async () => {
    // Object injection attempt — should not crash
    const res = await request(app)
      .get('/api/v1/user/groceries?search[$ne]=foo')
      .set('Authorization', `Bearer ${userToken}`);

    // Should not be 500 — either 200 (ignored) or handled gracefully
    expect(res.status).not.toBe(500);
  });
});

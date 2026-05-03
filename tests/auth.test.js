'use strict';

/**
 * tests/auth.test.js — Authentication Endpoint Tests
 *
 * Tests for POST /api/v1/auth/register and POST /api/v1/auth/login.
 */

const request = require('supertest');
const app = require('../src/app');
const { setupDatabase, teardownDatabase } = require('./setup');

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass1',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.role).toBe('user');
    // Password must NEVER be returned
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'john@example.com', // same email
        password: 'SecurePass1',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already registered');
  });

  it('should reject registration with missing name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'noname@example.com',
        password: 'SecurePass1',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ])
    );
  });

  it('should reject registration with missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'No Email',
        password: 'SecurePass1',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'SecurePass1',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with short password (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Short Pass',
        email: 'short@example.com',
        password: 'Abc1',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with password missing uppercase', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'No Upper',
        email: 'noupper@example.com',
        password: 'alllowercase1',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with password missing number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'No Number',
        email: 'nonumber@example.com',
        password: 'AllLettersOnly',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should always assign the user role (prevent role injection)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'HackPass1',
        role: 'admin', // should be ignored
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('should reject completely empty body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'SecurePass1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('john@example.com');
    // Password must NEVER be returned
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'WrongPass1',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Generic message to prevent email enumeration
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SecurePass1',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Same generic message — no email enumeration
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should reject login with missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'SecurePass1' });

    expect(res.status).toBe(422);
  });

  it('should reject login with missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john@example.com' });

    expect(res.status).toBe(422);
  });

  it('should reject login with empty body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(422);
  });
});

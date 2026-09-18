import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

const app = (await import('../../src/app.js')).default;

describe('HU22 - Registro de Administradores', () => {
  let adminToken;

  beforeEach(() => {
    vi.clearAllMocks();

    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('given valid data and admin token', () => {
    it('should return 201 with new user data', async () => {
      const hashedPassword = await bcrypt.hash('clave123', 12);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        email: 'nuevo-admin@test.com',
        password: hashedPassword,
        name: 'Nuevo Admin',
        role: 'ADMIN',
      });

      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'nuevo-admin@test.com', password: 'clave123', name: 'Nuevo Admin' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id', 2);
      expect(res.body.data).toHaveProperty('email', 'nuevo-admin@test.com');
      expect(res.body.data).toHaveProperty('name', 'Nuevo Admin');
      expect(res.body.data).toHaveProperty('role', 'ADMIN');
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe('given duplicate email', () => {
    it('should return 400 with validation error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'existing@test.com',
      });

      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'existing@test.com', password: 'clave123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'El email ya está registrado');
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given missing authorization header', () => {
    it('should return 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .send({ email: 'nuevo-admin@test.com', password: 'clave123' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('given token with USER role', () => {
    it('should return 403', async () => {
      const userToken = jwt.sign(
        { id: 2, email: 'user@test.com', role: 'USER' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'nuevo-admin@test.com', password: 'clave123' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('given missing email', () => {
    it('should return 400 with validation error', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'clave123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given short password', () => {
    it('should return 400 with validation error', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'nuevo-admin@test.com', password: '1234567' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given database error', () => {
    it('should return 500 with internal server error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app)
        .post('/api/v1/admin/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'nuevo-admin@test.com', password: 'clave123' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Error interno del servidor');
      expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });
});

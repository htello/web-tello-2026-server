import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

const app = (await import('../../src/app.js')).default;

describe('HU20 - Login Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('given valid credentials', () => {
    it('should return 200 with token and user data', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id', 1);
      expect(res.body.data.user).toHaveProperty('email', 'admin@test.com');
      expect(res.body.data.user).toHaveProperty('role', 'ADMIN');
      expect(res.body.data.user).not.toHaveProperty('password');

      const decoded = jwt.verify(res.body.data.token, JWT_SECRET);
      expect(decoded).toHaveProperty('id', 1);
      expect(decoded).toHaveProperty('email', 'admin@test.com');
      expect(decoded).toHaveProperty('role', 'ADMIN');
    });
  });

  describe('given email not found', () => {
    it('should return 401 with invalid credentials error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'admin123' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
      expect(res.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('given wrong password', () => {
    it('should return 401 with invalid credentials error', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
      expect(res.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('given missing email', () => {
    it('should return 400 with validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'admin123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given missing password', () => {
    it('should return 400 with validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given empty body', () => {
    it('should return 400 with validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given database error', () => {
    it('should return 500 with internal server error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'admin123' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Error interno del servidor');
      expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';
import { JWT_SECRET } from '../lib/constants.js';

const { login, register } = await import('../controllers/auth.js');

describe('HU20 - Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('login', () => {
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
        req.body = { email: 'admin@test.com', password: 'admin123' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              token: expect.any(String),
              user: expect.objectContaining({
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN',
              }),
            }),
          })
        );

        const { data } = res.json.mock.calls[0][0];
        const decoded = jwt.verify(data.token, JWT_SECRET);
        expect(decoded).toHaveProperty('id', 1);
        expect(decoded).toHaveProperty('email', 'admin@test.com');
        expect(decoded).toHaveProperty('role', 'ADMIN');
      });
    });

    describe('given email not found', () => {
      it('should return 401', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        req.body = { email: 'nonexistent@test.com', password: 'admin123' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Credenciales inválidas',
          code: 'UNAUTHORIZED',
        });
      });
    });

    describe('given wrong password', () => {
      it('should return 401', async () => {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const mockUser = {
          id: 1,
          email: 'admin@test.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        req.body = { email: 'admin@test.com', password: 'wrongpassword' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Credenciales inválidas',
          code: 'UNAUTHORIZED',
        });
      });
    });

    describe('given database error', () => {
      it('should return 500', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.body = { email: 'admin@test.com', password: 'admin123' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('register', () => {
    describe('given valid data and unique email', () => {
      it('should return 201 with user data and role ADMIN', async () => {
        const hashedPassword = await bcrypt.hash('clave123', 12);
        const createdUser = {
          id: 2,
          email: 'nuevo-admin@test.com',
          password: hashedPassword,
          name: 'Nuevo Admin',
          role: 'ADMIN',
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(createdUser);
        req.body = { email: 'nuevo-admin@test.com', password: 'clave123', name: 'Nuevo Admin' };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: 2,
              email: 'nuevo-admin@test.com',
              name: 'Nuevo Admin',
              role: 'ADMIN',
            }),
          })
        );

        const { data } = res.json.mock.calls[0][0];
        expect(data).not.toHaveProperty('password');
      });
    });

    describe('given duplicate email', () => {
      it('should return 400 with validation error', async () => {
        const existingUser = { id: 1, email: 'existing@test.com' };
        mockPrisma.user.findUnique.mockResolvedValue(existingUser);
        req.body = { email: 'existing@test.com', password: 'clave123' };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'El email ya está registrado',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given database error', () => {
      it('should return 500 with internal server error', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.body = { email: 'nuevo-admin@test.com', password: 'clave123' };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });
});

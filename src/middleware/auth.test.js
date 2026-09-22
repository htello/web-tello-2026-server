import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/constants.js';

const { authenticate, requireAdmin } = await import('../middleware/auth.js');

describe('HU21 - Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    describe('given valid Bearer token', () => {
      it('should call next and attach user to req', () => {
        const payload = { id: 1, email: 'admin@test.com', role: 'ADMIN' };
        const token = jwt.sign(payload, JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(1);
        expect(req.user.email).toBe('admin@test.com');
        expect(req.user.role).toBe('ADMIN');
      });
    });

    describe('given missing authorization header', () => {
      it('should return 401', () => {
        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token de autenticación requerido',
          code: 'UNAUTHORIZED',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('given authorization header without Bearer prefix', () => {
      it('should return 401', () => {
        req.headers.authorization = 'Token abc123';

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token de autenticación requerido',
          code: 'UNAUTHORIZED',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('given expired token', () => {
      it('should return 403', () => {
        const payload = { id: 1, email: 'admin@test.com', role: 'ADMIN' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
        req.headers.authorization = `Bearer ${token}`;

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token inválido o expirado',
          code: 'FORBIDDEN',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('given invalid token signature', () => {
      it('should return 403', () => {
        const token = jwt.sign({ id: 1 }, 'wrong-secret');
        req.headers.authorization = `Bearer ${token}`;

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token inválido o expirado',
          code: 'FORBIDDEN',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('requireAdmin', () => {
    describe('given user with ADMIN role', () => {
      it('should call next', () => {
        req.user = { id: 1, role: 'ADMIN' };

        requireAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });

    describe('given user with USER role', () => {
      it('should return 403', () => {
        req.user = { id: 2, role: 'USER' };

        requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Acceso denegado. Se requiere rol de administrador',
          code: 'FORBIDDEN',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('given no user in request', () => {
      it('should return 403', () => {
        requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Acceso denegado. Se requiere rol de administrador',
          code: 'FORBIDDEN',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});

/**
 * @fileoverview Tests unitarios del controller de gestión de usuarios admin.
 *
 * Cubre los endpoints de gestión de usuarios: list, getById, update,
 * remove y resetPassword (protegidos con rol ADMIN).
 *
 * @module controllers/users.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { list, getById, update, remove, resetPassword } = await import('../controllers/users.js');
const logger = (await import('../services/logger.js')).default;

describe('Gestión de Usuarios (Admin)', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('list', () => {
    describe('given users exist', () => {
      it('should return 200 with users and pagination meta', async () => {
        mockPrisma.user.findMany.mockResolvedValue([
          { id: 1, email: 'admin@test.com', name: 'Administrador', role: 'ADMIN', createdAt: new Date('2024-01-10T08:00:00Z') },
        ]);
        mockPrisma.user.count.mockResolvedValue(1);
        req.query = { page: '1', limit: '20' };

        await list(req, res);

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 20,
          orderBy: { id: 'asc' },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        expect(mockPrisma.user.count).toHaveBeenCalledWith();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, email: 'admin@test.com', name: 'Administrador', role: 'ADMIN', createdAt: new Date('2024-01-10T08:00:00Z') },
          ],
          meta: { total: 1, page: 1, limit: 20, pages: 1 },
        });
      });

      it('should default page and limit when not provided', async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);
        req.query = {};

        await list(req, res);

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 20,
          orderBy: { id: 'asc' },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        expect(res.json).toHaveBeenCalledWith({
          data: [],
          meta: { total: 0, page: 1, limit: 20, pages: 0 },
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.findMany.mockRejectedValue(new Error('DB Error'));

        await list(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('getById', () => {
    describe('given an existing user', () => {
      it('should return 200 with the user', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          email: 'admin@test.com',
          name: 'Administrador',
          role: 'ADMIN',
          createdAt: new Date('2024-01-10T08:00:00Z'),
        });
        req.params = { id: '1' };

        await getById(req, res);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            email: 'admin@test.com',
            name: 'Administrador',
            role: 'ADMIN',
            createdAt: new Date('2024-01-10T08:00:00Z'),
          },
        });
      });
    });

    describe('given a non-existent user', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        req.params = { id: '999' };

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Usuario no encontrado',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '1' };

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('update', () => {
    describe('given valid data', () => {
      it('should return 200 with updated user', async () => {
        mockPrisma.user.update.mockResolvedValue({
          id: 2,
          email: 'actualizado@test.com',
          name: 'Nombre Actualizado',
          role: 'ADMIN',
        });
        req.params = { id: '2' };
        req.body = { email: 'actualizado@test.com', name: 'Nombre Actualizado', role: 'ADMIN' };

        await update(req, res);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 2 },
          data: {
            email: 'actualizado@test.com',
            name: 'Nombre Actualizado',
            role: 'ADMIN',
          },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given user does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to update not found');
        error.code = 'P2025';
        mockPrisma.user.update.mockRejectedValue(error);
        req.params = { id: '999' };
        req.body = { name: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Usuario no encontrado',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given duplicate email', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.user.update.mockRejectedValue(dupError);
        req.params = { id: '2' };
        req.body = { email: 'admin@test.com' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe un usuario con ese email',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.update.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '2' };
        req.body = { name: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('remove', () => {
    describe('given existing user', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.user.delete.mockResolvedValue({ id: 2 });
        req.params = { id: '2' };

        await remove(req, res);

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Usuario eliminado correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given user does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to delete does not exist');
        error.code = 'P2025';
        mockPrisma.user.delete.mockRejectedValue(error);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Usuario no encontrado',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.delete.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '2' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('resetPassword', () => {
    describe('given existing user', () => {
      it('should return 200 and store a hashed password', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 2, email: 'user@test.com' });
        mockPrisma.user.update.mockResolvedValue({ id: 2 });
        req.params = { id: '2' };
        req.body = { password: 'nuevaClave123' };

        await resetPassword(req, res);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
        const updateCall = mockPrisma.user.update.mock.calls[0][0];
        expect(updateCall.where).toEqual({ id: 2 });
        expect(typeof updateCall.data.password).toBe('string');
        expect(updateCall.data.password).not.toBe('nuevaClave123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Contraseña actualizada correctamente' },
        });
      });
    });

    describe('given user does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        req.params = { id: '999' };
        req.body = { password: 'nuevaClave123' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Usuario no encontrado',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 2 });
        mockPrisma.user.update.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '2' };
        req.body = { password: 'nuevaClave123' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });
});

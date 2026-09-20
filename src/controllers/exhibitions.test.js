/**
 * @fileoverview Tests unitarios del controller de exposiciones.
 *
 * Cubre HU07 - Admin Exposiciones: create, update, remove, reorder.
 *
 * @module controllers/exhibitions.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { create, update, remove, reorder, listAll } = await import('./exhibitions.js');
const logger = (await import('../services/logger.js')).default;

describe('HU07 - Admin Exposiciones', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('listAll', () => {
    describe('given exhibitions exist', () => {
      it('should return 200 with exhibitions ordered by position', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          { id: 1, title: 'Expo Uno', position: 0 },
          { id: 2, title: 'Expo Dos', position: 1 },
        ]);

        await listAll(req, res);

        expect(mockPrisma.exhibition.findMany).toHaveBeenCalledWith({
          orderBy: { position: 'asc' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Expo Uno', position: 0 },
            { id: 2, title: 'Expo Dos', position: 1 },
          ],
        });
      });
    });

    describe('given no exhibitions', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.findMany.mockRejectedValue(new Error('DB Error'));

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('create', () => {
    describe('given valid data', () => {
      it('should return 201 with created exhibition', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          location: 'Madrid',
          description: null,
          position: 0,
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          location: 'Madrid',
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: 'Madrid',
            description: null,
          },
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: 'Madrid',
            description: null,
            position: 0,
          },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.create.mockRejectedValue(new Error('DB Error'));
        req.body = { title: 'Test', date: '2024-06-01' };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('update', () => {
    describe('given valid data', () => {
      it('should return 200 with updated exhibition', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-06-01'),
          location: null,
          description: null,
        });
        req.params = { id: '1' };
        req.body = { title: 'Nuevo' };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Nuevo' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Nuevo',
            date: new Date('2024-06-01'),
            location: null,
            description: null,
          },
        });
        expect(logger.info).toHaveBeenCalled();
      });

      it('should update all optional fields', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-12-01'),
          location: 'Barcelona',
          description: 'Descripción',
        });
        req.params = { id: '1' };
        req.body = {
          title: 'Nuevo',
          date: '2024-12-01',
          location: 'Barcelona',
          description: 'Descripción',
        };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            title: 'Nuevo',
            date: new Date('2024-12-01'),
            location: 'Barcelona',
            description: 'Descripción',
          },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('given exhibition does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.update.mockRejectedValue(notFoundError);
        req.params = { id: '999' };
        req.body = { title: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Exposición no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.update.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '1' };
        req.body = { title: 'Test' };

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
    describe('given existing exhibition', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.exhibition.delete.mockResolvedValue({ id: 1 });
        req.params = { id: '1' };

        await remove(req, res);

        expect(mockPrisma.exhibition.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Exposición eliminada correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given exhibition does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to delete does not exist');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.delete.mockRejectedValue(notFoundError);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Exposición no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.delete.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '1' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('reorder', () => {
    describe('given orderedIds', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({ id: 2, position: 0 });
        req.body = { orderedIds: [2, 1] };

        await reorder(req, res);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Orden actualizado correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.update.mockRejectedValue(new Error('DB Error'));
        req.body = { orderedIds: [1, 2] };

        await reorder(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });
});
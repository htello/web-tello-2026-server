/**
 * @fileoverview Tests unitarios del controller de biografía.
 *
 * Cubre HU12 - Admin Biografía: get y createOrUpdate (con y sin imageUrl).
 *
 * @module controllers/biography.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { get, createOrUpdate } = await import('./biography.js');
const logger = (await import('../services/logger.js')).default;

describe('HU12 - Admin Biografía', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return 200 with biography', async () => {
      mockPrisma.biography.findFirst.mockResolvedValue({
        id: 1,
        content: 'Mi biografía',
        imageUrl: 'https://example.com/portrait.jpg',
      });

      await get(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 1, content: 'Mi biografía', imageUrl: 'https://example.com/portrait.jpg' },
      });
    });

    it('should return 404 when biography does not exist', async () => {
      mockPrisma.biography.findFirst.mockResolvedValue(null);

      await get(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Biografía no encontrada',
        code: 'NOT_FOUND',
      });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.biography.findFirst.mockRejectedValue(new Error('DB Error'));

      await get(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createOrUpdate', () => {
    describe('when biography already exists', () => {
      it('should update content and persist imageUrl', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Actualizada',
          imageUrl: 'https://example.com/new.jpg',
        });
        req.body = { content: 'Actualizada', imageUrl: 'https://example.com/new.jpg' };

        await createOrUpdate(req, res);

        expect(mockPrisma.biography.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { content: 'Actualizada', imageUrl: 'https://example.com/new.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should update content with null imageUrl when not provided', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Actualizada',
          imageUrl: null,
        });
        req.body = { content: 'Actualizada' };

        await createOrUpdate(req, res);

        expect(mockPrisma.biography.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { content: 'Actualizada', imageUrl: null },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('when biography does not exist', () => {
      it('should create biography and persist imageUrl', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({
          id: 1,
          content: 'Nueva',
          imageUrl: 'https://example.com/portrait.jpg',
        });
        req.body = { content: 'Nueva', imageUrl: 'https://example.com/portrait.jpg' };

        await createOrUpdate(req, res);

        expect(mockPrisma.biography.create).toHaveBeenCalledWith({
          data: { content: 'Nueva', imageUrl: 'https://example.com/portrait.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should create biography with null imageUrl when not provided', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({
          id: 1,
          content: 'Nueva',
          imageUrl: null,
        });
        req.body = { content: 'Nueva' };

        await createOrUpdate(req, res);

        expect(mockPrisma.biography.create).toHaveBeenCalledWith({
          data: { content: 'Nueva', imageUrl: null },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.biography.findFirst.mockRejectedValue(new Error('DB Error'));
      req.body = { content: 'Contenido de prueba' };

      await createOrUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

/**
 * @fileoverview Tests unitarios del controller de colecciones.
 *
 * Cubre HU01 - Galería de Colecciones (listado público de colecciones publicadas)
 * junto con los handlers admin de HU06.
 *
 * @module controllers/collections.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

const { listPublished } = await import('../controllers/collections.js');

describe('HU01 - Galería de Colecciones', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('listPublished', () => {
    describe('given published collections exist', () => {
      it('should return 200 with collections and paintingsCount', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Colección Uno',
            description: 'Descripción',
            coverImage: 'https://example.com/cover.jpg',
            position: 0,
            isPublished: true,
            _count: { paintings: 3 },
          },
          {
            id: 2,
            title: 'Colección Dos',
            description: null,
            coverImage: null,
            position: 1,
            isPublished: true,
            _count: { paintings: 0 },
          },
        ]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const { data } = res.json.mock.calls[0][0];
        expect(data).toHaveLength(2);
        expect(data[0]).toMatchObject({
          id: 1,
          title: 'Colección Uno',
          coverImage: 'https://example.com/cover.jpg',
          paintingsCount: 3,
        });
        expect(data[1]).toMatchObject({ id: 2, paintingsCount: 0 });
        expect(data[0]).not.toHaveProperty('_count');
      });

      it('should query only published collections ordered by position', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { paintings: { where: { isPublished: true } } } },
          },
        });
      });
    });

    describe('given no published collections', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 with internal error', async () => {
        mockPrisma.collection.findMany.mockRejectedValue(new Error('DB Error'));

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });
});

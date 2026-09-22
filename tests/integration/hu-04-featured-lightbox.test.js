/**
 * @fileoverview Tests de integración de HU04 - Obras Destacadas.
 *
 * Verifica el endpoint público GET /api/v1/paintings/featured.
 *
 * @module tests/integration/hu-04-featured-lightbox
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU04 - Obras Destacadas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/paintings/featured', () => {
    describe('given featured published paintings exist', () => {
      it('should return 200 with an array of paintings including collection', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Atardecer',
            imageUrl: 'https://example.com/1.jpg',
            collection: { id: 3, title: 'Colección Uno' },
          },
        ]);

        const res = await request(app).get('/api/v1/paintings/featured');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0]).toMatchObject({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://example.com/1.jpg',
          collection: { id: 3, title: 'Colección Uno' },
        });
        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith({
          where: { isFeatured: true, isPublished: true },
          include: { collection: { select: { id: true, title: true } } },
        });
      });
    });

    describe('given no featured paintings', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/paintings/featured');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/paintings/featured');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

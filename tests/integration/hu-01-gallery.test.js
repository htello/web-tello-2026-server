/**
 * @fileoverview Tests de integración de HU01 - Galería de Colecciones.
 *
 * Verifica el endpoint público GET /api/v1/collections.
 *
 * @module tests/integration/hu-01-gallery
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU01 - Galería de Colecciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/collections', () => {
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
        ]);

        const res = await request(app).get('/api/v1/collections');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0]).toMatchObject({
          id: 1,
          title: 'Colección Uno',
          coverImage: 'https://example.com/cover.jpg',
          paintingsCount: 3,
        });
        expect(res.body.data[0]).not.toHaveProperty('_count');
      });
    });

    describe('given no published collections', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/collections');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    describe('given no auth token', () => {
      it('should still return 200 (public endpoint)', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/collections');

        expect(res.status).toBe(200);
      });
    });
  });
});

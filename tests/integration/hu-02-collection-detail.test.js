/**
 * @fileoverview Tests de integración de HU02 - Detalle de Colección.
 *
 * Verifica el endpoint público GET /api/v1/collections/:id.
 *
 * @module tests/integration/hu-02-collection-detail
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU02 - Detalle de Colección', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/collections/:id', () => {
    describe('given an existing collection', () => {
      it('should return 200 with the collection and its paintings', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({
          id: 1,
          title: 'Colección Uno',
          paintings: [
            { id: 10, title: 'Pintura A', position: 0 },
            { id: 11, title: 'Pintura B', position: 1 },
          ],
        });

        const res = await request(app).get('/api/v1/collections/1');

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ id: 1, title: 'Colección Uno' });
        expect(res.body.data.paintings).toHaveLength(2);
        expect(mockPrisma.collection.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: { paintings: { orderBy: { position: 'asc' } } },
        });
      });
    });

    describe('given a non-existent collection', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue(null);

        const res = await request(app).get('/api/v1/collections/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.findUnique.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/collections/1');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

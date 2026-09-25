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
    describe('given an existing published collection', () => {
      it('should return 200 with the collection and its published paintings as PaintingSummary', async () => {
        mockPrisma.collection.findFirst.mockResolvedValue({
          id: 1,
          title: 'Colección Uno',
          description: null,
          coverImage: null,
          position: 0,
          isPublished: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-02T00:00:00Z'),
          paintings: [
            {
              id: 10,
              title: 'Pintura A',
              imageUrl: null,
              dimensions: null,
              technique: null,
              year: 2001,
              isFeatured: false,
              isPublished: true,
              position: 0,
              collectionId: 1,
              createdAt: new Date('2026-01-01T00:00:00Z'),
              updatedAt: new Date('2026-01-02T00:00:00Z'),
            },
            {
              id: 11,
              title: 'Pintura B',
              imageUrl: null,
              dimensions: null,
              technique: null,
              year: 2002,
              isFeatured: true,
              isPublished: true,
              position: 1,
              collectionId: 1,
              createdAt: new Date('2026-01-01T00:00:00Z'),
              updatedAt: new Date('2026-01-02T00:00:00Z'),
            },
          ],
        });

        const res = await request(app).get('/api/v1/collections/1');

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ id: 1, title: 'Colección Uno' });
        expect(res.body.data).not.toHaveProperty('createdAt');
        expect(res.body.data.paintings).toHaveLength(2);
        expect(res.body.data.paintings[0]).toEqual({
          id: 10,
          title: 'Pintura A',
          imageUrl: null,
          dimensions: null,
          technique: null,
          year: 2001,
          isFeatured: false,
        });
        expect(mockPrisma.collection.findFirst).toHaveBeenCalledWith({
          where: { id: 1, isPublished: true },
          include: {
            paintings: {
              where: { isPublished: true },
              orderBy: [{ position: 'asc' }, { id: 'asc' }],
            },
          },
        });
      });
    });

    describe('given a non-existent or unpublished collection', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.collection.findFirst.mockResolvedValue(null);

        const res = await request(app).get('/api/v1/collections/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.findFirst.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/collections/1');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

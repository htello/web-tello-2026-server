/**
 * @fileoverview Tests de integración de HU05 - Exposiciones.
 *
 * Verifica el endpoint público GET /api/v1/exhibitions.
 *
 * @module tests/integration/hu-05-exhibitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU05 - Exposiciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/exhibitions', () => {
    describe('given exhibitions exist', () => {
      it('should return 200 with exhibitions ordered by position', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          { id: 1, title: 'Expo Uno', position: 0 },
          { id: 2, title: 'Expo Dos', position: 1 },
        ]);

        const res = await request(app).get('/api/v1/exhibitions');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0]).toMatchObject({ id: 1, title: 'Expo Uno' });
        expect(mockPrisma.exhibition.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: { images: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
        });
      });
    });

    describe('given exhibitions with images', () => {
      it('should return 200 including serialized images', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Expo Uno',
            date: new Date('2024-06-01T00:00:00Z'),
            endDate: null,
            position: 0,
            images: [
              { id: 10, url: 'https://cdn/1.jpg', thumbnail: null, width: null, height: null, position: 0 },
            ],
          },
        ]);

        const res = await request(app).get('/api/v1/exhibitions');

        expect(res.status).toBe(200);
        expect(res.body.data[0].images).toHaveLength(1);
        expect(res.body.data[0].images[0]).toMatchObject({ url: 'https://cdn/1.jpg', position: 0 });
      });
    });

    describe('given no exhibitions', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/exhibitions');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/exhibitions');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

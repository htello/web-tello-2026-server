/**
 * @fileoverview Tests de integración de HU09 - Galería Ilustración.
 *
 * Verifica el endpoint público GET /api/v1/illustrations.
 *
 * @module tests/integration/hu-09-illustration-gallery
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU09 - Galería Ilustración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/illustrations', () => {
    describe('given illustrations exist', () => {
      it('should return 200 with all illustrations', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([
          { id: 1, title: 'Bosque Encantado', imageUrl: 'https://example.com/a.jpg' },
          { id: 2, title: 'Dragón', imageUrl: 'https://example.com/b.jpg' },
        ]);

        const res = await request(app).get('/api/v1/illustrations');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0]).toMatchObject({ id: 1, title: 'Bosque Encantado' });
        expect(mockPrisma.illustration.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
      });
    });

    describe('given no illustrations', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/illustrations');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/illustrations');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

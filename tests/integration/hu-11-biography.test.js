/**
 * @fileoverview Tests de integración de HU11 - Leer Biografía.
 *
 * Verifica el endpoint público GET /api/v1/biography.
 *
 * @module tests/integration/hu-11-biography
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU11 - Leer Biografía', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/biography', () => {
    describe('given biography exists', () => {
      it('should return 200 with biography', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({
          id: 1,
          content: 'Mi biografía',
          imageUrl: 'https://example.com/portrait.jpg',
        });

        const res = await request(app).get('/api/v1/biography');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('content', 'Mi biografía');
        expect(res.body.data).toHaveProperty('imageUrl', 'https://example.com/portrait.jpg');
      });
    });

    describe('given no biography', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);

        const res = await request(app).get('/api/v1/biography');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.biography.findFirst.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/biography');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

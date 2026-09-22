/**
 * @fileoverview Tests de integración de HU03 - Ficha de Pintura.
 *
 * Verifica el endpoint público GET /api/v1/paintings/:id.
 *
 * @module tests/integration/hu-03-painting-card
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU03 - Ficha de Pintura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/paintings/:id', () => {
    describe('given an existing painting', () => {
      it('should return 200 with the painting and its collection', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collection: { id: 3, title: 'Colección Uno' },
        });

        const res = await request(app).get('/api/v1/paintings/1');

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collection: { id: 3, title: 'Colección Uno' },
        });
        expect(mockPrisma.painting.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: { collection: { select: { id: true, title: true } } },
        });
      });
    });

    describe('given a non-existent painting', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue(null);

        const res = await request(app).get('/api/v1/paintings/999');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findUnique.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/paintings/1');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

/**
 * @fileoverview Tests de integración de HU08 - Filtrar Diseño.
 *
 * Verifica el endpoint público GET /api/v1/design, que exige filtro por subcategoría.
 *
 * @module tests/integration/hu-08-design-filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma-mock.js';

const app = (await import('../../src/app.js')).default;

describe('HU08 - Filtrar Diseño', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/design', () => {
    describe('given no query params', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app).get('/api/v1/design');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          error: 'La subcategoría es obligatoria',
          code: 'VALIDATION_ERROR',
        });
        expect(mockPrisma.designProject.findMany).not.toHaveBeenCalled();
      });
    });

    describe('given a subcategory filter', () => {
      it('should return 200 with only matching projects', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([
          { id: 1, title: 'Branding Café Aroma', subcategory: 'imagen-corporativa' },
        ]);

        const res = await request(app).get('/api/v1/design?subcategory=imagen-corporativa');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({
          id: 1,
          title: 'Branding Café Aroma',
          subcategory: 'imagen-corporativa',
        });
        expect(mockPrisma.designProject.findMany).toHaveBeenCalledWith({
          where: { subcategory: 'imagen-corporativa', isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
      });
    });

    describe('given a subcategory with no matches', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/design?subcategory=packaging-expositores');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    describe('given an invalid subcategory', () => {
      it('should return 404 NOT_FOUND', async () => {
        const res = await request(app).get('/api/v1/design?subcategory=COSA');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
          error: 'Subcategoría inválida',
          code: 'NOT_FOUND',
        });
        expect(mockPrisma.designProject.findMany).not.toHaveBeenCalled();
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.findMany.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app).get('/api/v1/design?subcategory=editorial');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

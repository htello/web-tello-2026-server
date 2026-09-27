/**
 * @fileoverview Tests unitarios de la factory de handlers de listado paginado.
 *
 * @module lib/paginated-list.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { createPaginatedListHandler } = await import('./paginated-list.js');
const logger = (await import('../services/logger.js')).default;

const createRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('lib/paginated-list - createPaginatedListHandler', () => {
  let model;

  beforeEach(() => {
    vi.clearAllMocks();
    model = { findMany: vi.fn(), count: vi.fn() };
  });

  describe('given default pagination', () => {
    it('should return 200 with data and meta', async () => {
      model.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      model.count.mockResolvedValue(2);
      const handler = createPaginatedListHandler({ model, errorMessage: 'Error al listar' });
      const res = createRes();

      await handler({ query: {} }, res);

      expect(model.findMany).toHaveBeenCalledWith({ skip: 0, take: 20 });
      expect(model.count).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 2, page: 1, limit: 20, pages: 1 },
      });
    });
  });

  describe('given pagination query params', () => {
    it('should apply page and limit', async () => {
      model.findMany.mockResolvedValue([]);
      model.count.mockResolvedValue(7);
      const handler = createPaginatedListHandler({ model, errorMessage: 'Error al listar' });
      const res = createRes();

      await handler({ query: { page: '2', limit: '5' } }, res);

      expect(model.findMany).toHaveBeenCalledWith({ skip: 5, take: 5 });
      expect(res.json).toHaveBeenCalledWith({
        data: [],
        meta: { total: 7, page: 2, limit: 5, pages: 2 },
      });
    });
  });

  describe('given findManyArgs', () => {
    it('should merge them into findMany call', async () => {
      model.findMany.mockResolvedValue([]);
      model.count.mockResolvedValue(0);
      const findManyArgs = {
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: { collection: { select: { id: true, title: true } } },
      };
      const handler = createPaginatedListHandler({ model, findManyArgs, errorMessage: 'Error al listar' });
      const res = createRes();

      await handler({ query: {} }, res);

      expect(model.findMany).toHaveBeenCalledWith({ skip: 0, take: 20, ...findManyArgs });
    });
  });

  describe('given a buildWhere option', () => {
    it('should apply returned where to findMany and count', async () => {
      model.findMany.mockResolvedValue([]);
      model.count.mockResolvedValue(4);
      const handler = createPaginatedListHandler({
        model,
        buildWhere: (query) => (query.collectionId ? { collectionId: Number(query.collectionId) } : {}),
        errorMessage: 'Error al listar',
      });
      const res = createRes();

      await handler({ query: { collectionId: '7' } }, res);

      expect(model.findMany).toHaveBeenCalledWith({ skip: 0, take: 20, where: { collectionId: 7 } });
      expect(model.count).toHaveBeenCalledWith({ where: { collectionId: 7 } });
      expect(res.json).toHaveBeenCalledWith({
        data: [],
        meta: { total: 4, page: 1, limit: 20, pages: 1 },
      });
    });

    it('should omit where when buildWhere returns an empty filter', async () => {
      model.findMany.mockResolvedValue([]);
      model.count.mockResolvedValue(0);
      const handler = createPaginatedListHandler({
        model,
        findManyArgs: { orderBy: [{ position: 'asc' }] },
        buildWhere: () => ({}),
        errorMessage: 'Error al listar',
      });
      const res = createRes();

      await handler({ query: {} }, res);

      expect(model.findMany).toHaveBeenCalledWith({ skip: 0, take: 20, orderBy: [{ position: 'asc' }] });
      expect(model.count).toHaveBeenCalledWith();
    });

    it('should merge findManyArgs.where with the filter where', async () => {
      model.findMany.mockResolvedValue([]);
      model.count.mockResolvedValue(1);
      const handler = createPaginatedListHandler({
        model,
        findManyArgs: { where: { isPublished: true } },
        buildWhere: () => ({ collectionId: 2 }),
        errorMessage: 'Error al listar',
      });
      const res = createRes();

      await handler({ query: {} }, res);

      expect(model.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: { isPublished: true, collectionId: 2 },
      });
      expect(model.count).toHaveBeenCalledWith({ where: { isPublished: true, collectionId: 2 } });
    });

    it('should return 400 VALIDATION_ERROR when buildWhere returns an error message', async () => {
      const handler = createPaginatedListHandler({
        model,
        buildWhere: () => 'El collectionId debe ser un entero positivo',
        errorMessage: 'Error al listar',
      });
      const res = createRes();

      await handler({ query: { collectionId: 'abc' } }, res);

      expect(model.findMany).not.toHaveBeenCalled();
      expect(model.count).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El collectionId debe ser un entero positivo',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('given a serialize function', () => {
    it('should map items through it', async () => {
      model.findMany.mockResolvedValue([
        { id: 1, _count: { paintings: 3 } },
      ]);
      model.count.mockResolvedValue(1);
      const serialize = ({ _count, ...item }) => ({ ...item, paintingsCount: _count.paintings });
      const handler = createPaginatedListHandler({ model, serialize, errorMessage: 'Error al listar' });
      const res = createRes();

      await handler({ query: {} }, res);

      expect(res.json).toHaveBeenCalledWith({
        data: [{ id: 1, paintingsCount: 3 }],
        meta: { total: 1, page: 1, limit: 20, pages: 1 },
      });
    });
  });

  describe('given a database error', () => {
    it('should return 500 INTERNAL_ERROR and log it', async () => {
      model.findMany.mockRejectedValue(new Error('DB Error'));
      const handler = createPaginatedListHandler({ model, errorMessage: 'Error al listar' });
      const res = createRes();

      await handler({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

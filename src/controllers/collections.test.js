/**
 * @fileoverview Tests unitarios del controller de colecciones.
 *
 * Cubre HU01 - Galería de Colecciones (listado público de colecciones publicadas)
 * junto con los handlers admin de HU06.
 *
 * @module controllers/collections.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const logger = (await import('../services/logger.js')).default;
const { listPublished, listAll, getById, create, update, remove, reorder } = await import('../controllers/collections.js');

describe('HU01 - Galería de Colecciones', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('listPublished', () => {
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
          {
            id: 2,
            title: 'Colección Dos',
            description: null,
            coverImage: null,
            position: 1,
            isPublished: true,
            _count: { paintings: 0 },
          },
        ]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const { data } = res.json.mock.calls[0][0];
        expect(data).toHaveLength(2);
        expect(data[0]).toMatchObject({
          id: 1,
          title: 'Colección Uno',
          coverImage: 'https://example.com/cover.jpg',
          paintingsCount: 3,
        });
        expect(data[1]).toMatchObject({ id: 2, paintingsCount: 0 });
        expect(data[0]).not.toHaveProperty('_count');
      });

      it('should query only published collections with published paintings ordered by position', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
          where: {
            isPublished: true,
            paintings: { some: { isPublished: true } },
          },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: {
            _count: { select: { paintings: { where: { isPublished: true } } } },
          },
        });
      });
    });

    describe('given no published collections', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 with internal error', async () => {
        mockPrisma.collection.findMany.mockRejectedValue(new Error('DB Error'));

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('listAll', () => {
    describe('given collections exist (published and unpublished)', () => {
      it('should return 200 with all collections and paintingsCount', async () => {
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
          {
            id: 2,
            title: 'Colección Dos',
            description: null,
            coverImage: null,
            position: 1,
            isPublished: false,
            _count: { paintings: 0 },
          },
        ]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const { data } = res.json.mock.calls[0][0];
        expect(data).toHaveLength(2);
        expect(data[0]).toMatchObject({
          id: 1,
          title: 'Colección Uno',
          isPublished: true,
          paintingsCount: 3,
        });
        expect(data[1]).toMatchObject({ id: 2, isPublished: false, paintingsCount: 0 });
        expect(data[0]).not.toHaveProperty('_count');
      });

      it('should query all collections ordered by position without published filter', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        await listAll(req, res);

        expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: {
            _count: { select: { paintings: true } },
          },
        });
      });
    });

    describe('given no collections', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.collection.findMany.mockResolvedValue([]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 with internal error', async () => {
        mockPrisma.collection.findMany.mockRejectedValue(new Error('DB Error'));

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('getById', () => {
    describe('given an existing published collection', () => {
      it('should return 200 with the collection and only its published paintings as PaintingSummary', async () => {
        req = { params: { id: '1' } };
        mockPrisma.collection.findFirst.mockResolvedValue({
          id: 1,
          title: 'Colección Uno',
          description: 'Descripción',
          coverImage: null,
          position: 0,
          isPublished: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-02T00:00:00Z'),
          paintings: [
            {
              id: 10,
              title: 'Pintura A',
              imageUrl: 'https://example.com/a.jpg',
              dimensions: '100x80',
              technique: 'Óleo',
              year: 2001,
              isFeatured: false,
              isPublished: true,
              position: 0,
              collectionId: 1,
              createdAt: new Date('2026-01-01T00:00:00Z'),
              updatedAt: new Date('2026-01-02T00:00:00Z'),
            },
          ],
        });

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Colección Uno',
            description: 'Descripción',
            coverImage: null,
            position: 0,
            isPublished: true,
            paintings: [
              {
                id: 10,
                title: 'Pintura A',
                imageUrl: 'https://example.com/a.jpg',
                dimensions: '100x80',
                technique: 'Óleo',
                year: 2001,
                isFeatured: false,
              },
            ],
          },
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

    describe('given a non-existent collection', () => {
      it('should return 404 NOT_FOUND', async () => {
        req = { params: { id: '999' } };
        mockPrisma.collection.findFirst.mockResolvedValue(null);

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Colección no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        req = { params: { id: '1' } };
        mockPrisma.collection.findFirst.mockRejectedValue(new Error('DB Error'));

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('HU06 - Admin Colecciones', () => {
    describe('create', () => {
      describe('given valid data', () => {
        it('should return 201 with created collection', async () => {
          mockPrisma.collection.create.mockResolvedValue({
            id: 1,
            title: 'Mi Colección',
            description: null,
            coverImage: null,
            position: 0,
            isPublished: false,
          });
          req.body = { title: 'Mi Colección' };

          await create(req, res);

          expect(mockPrisma.collection.create).toHaveBeenCalledWith({
            data: { title: 'Mi Colección', description: null, coverImage: null },
          });
          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({ id: 1, title: 'Mi Colección' }),
            })
          );
          expect(logger.info).toHaveBeenCalled();
        });
      });

      describe('given valid data with position and isPublished', () => {
        it('should persist position and isPublished', async () => {
          mockPrisma.collection.create.mockResolvedValue({
            id: 1,
            title: 'Colección Publicada',
            description: null,
            coverImage: null,
            position: 3,
            isPublished: true,
          });
          req.body = { title: 'Colección Publicada', position: 3, isPublished: true };

          await create(req, res);

          expect(mockPrisma.collection.create).toHaveBeenCalledWith({
            data: {
              title: 'Colección Publicada',
              description: null,
              coverImage: null,
              position: 3,
              isPublished: true,
            },
          });
        });
      });

      describe('given duplicate title', () => {
        it('should return 400 DUPLICATE_ERROR', async () => {
          const dupError = new Error('Unique constraint failed');
          dupError.code = 'P2002';
          mockPrisma.collection.create.mockRejectedValue(dupError);
          req.body = { title: 'Óleos' };

          await create(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Ya existe una colección con ese título',
            code: 'DUPLICATE_ERROR',
          });
        });
      });

      describe('given a database error', () => {
        it('should return 500 INTERNAL_ERROR', async () => {
          mockPrisma.collection.create.mockRejectedValue(new Error('DB Error'));
          req.body = { title: 'Test' };

          await create(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR',
          });
        });
      });
    });

    describe('update', () => {
      describe('given valid data', () => {
        it('should return 200 with updated collection', async () => {
          mockPrisma.collection.update.mockResolvedValue({
            id: 1,
            title: 'Nuevo Título',
            description: null,
            coverImage: null,
            position: 0,
            isPublished: false,
          });
          req.params = { id: '1' };
          req.body = { title: 'Nuevo Título' };

          await update(req, res);

          expect(mockPrisma.collection.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { title: 'Nuevo Título' },
          });
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({ id: 1, title: 'Nuevo Título' }),
            })
          );
          expect(logger.info).toHaveBeenCalled();
        });
      });

      describe('given valid data with position and isPublished', () => {
        it('should persist position and isPublished', async () => {
          mockPrisma.collection.update.mockResolvedValue({
            id: 1,
            title: 'Colección Actualizada',
            position: 2,
            isPublished: false,
          });
          req.params = { id: '1' };
          req.body = { position: 2, isPublished: false };

          await update(req, res);

          expect(mockPrisma.collection.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { position: 2, isPublished: false },
          });
        });
      });

      describe('given collection does not exist', () => {
        it('should return 404 NOT_FOUND', async () => {
          const error = new Error('Record to update not found');
          error.code = 'P2025';
          mockPrisma.collection.update.mockRejectedValue(error);
          req.params = { id: '999' };
          req.body = { title: 'Test' };

          await update(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Colección no encontrada',
            code: 'NOT_FOUND',
          });
        });
      });

      describe('given duplicate title on update', () => {
        it('should return 400 DUPLICATE_ERROR', async () => {
          const dupError = new Error('Unique constraint failed');
          dupError.code = 'P2002';
          mockPrisma.collection.update.mockRejectedValue(dupError);
          req.params = { id: '1' };
          req.body = { title: 'Esculturas' };

          await update(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Ya existe una colección con ese título',
            code: 'DUPLICATE_ERROR',
          });
        });
      });

      describe('given a database error', () => {
        it('should return 500 INTERNAL_ERROR', async () => {
          mockPrisma.collection.update.mockRejectedValue(new Error('DB Error'));
          req.params = { id: '1' };
          req.body = { title: 'Test' };

          await update(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR',
          });
        });
      });
    });

    describe('remove', () => {
      describe('given existing collection', () => {
        it('should return 200 with success message', async () => {
          mockPrisma.collection.delete.mockResolvedValue({ id: 1 });
          req.params = { id: '1' };

          await remove(req, res);

          expect(mockPrisma.collection.delete).toHaveBeenCalledWith({ where: { id: 1 } });
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            data: { message: 'Colección eliminada correctamente' },
          });
          expect(logger.info).toHaveBeenCalled();
        });
      });

      describe('given collection does not exist', () => {
        it('should return 404 NOT_FOUND', async () => {
          const error = new Error('Record to delete does not exist');
          error.code = 'P2025';
          mockPrisma.collection.delete.mockRejectedValue(error);
          req.params = { id: '999' };

          await remove(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Colección no encontrada',
            code: 'NOT_FOUND',
          });
        });
      });

      describe('given a database error', () => {
        it('should return 500 INTERNAL_ERROR', async () => {
          mockPrisma.collection.delete.mockRejectedValue(new Error('DB Error'));
          req.params = { id: '1' };

          await remove(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR',
          });
        });
      });
    });

    describe('reorder', () => {
      describe('given orderedIds', () => {
        it('should return 200 with success message', async () => {
          mockPrisma.collection.update.mockResolvedValue({ id: 3, position: 0 });
          req.body = { orderedIds: [3, 1, 2] };

          await reorder(req, res);

          expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            data: { message: 'Orden actualizado correctamente' },
          });
          expect(logger.info).toHaveBeenCalled();
        });
      });

      describe('given a non-existent id', () => {
        it('should return 400 VALIDATION_ERROR', async () => {
          const notFoundError = new Error('Record to update not found');
          notFoundError.code = 'P2025';
          mockPrisma.collection.update.mockRejectedValue(notFoundError);
          req.body = { orderedIds: [999] };

          await reorder(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Uno o más IDs no existen',
            code: 'VALIDATION_ERROR',
          });
        });
      });

      describe('given a database error', () => {
        it('should return 500 INTERNAL_ERROR', async () => {
          mockPrisma.collection.update.mockRejectedValue(new Error('DB Error'));
          req.body = { orderedIds: [1, 2, 3] };

          await reorder(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR',
          });
        });
      });
    });
  });
});

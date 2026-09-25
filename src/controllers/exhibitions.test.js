/**
 * @fileoverview Tests unitarios del controller de exposiciones.
 *
 * Cubre HU07 - Admin Exposiciones: create, update, remove, reorder,
 * y la gestión de imágenes múltiples (create/update anidados).
 *
 * @module controllers/exhibitions.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { create, update, remove, reorder, listPublished, listAll } = await import('./exhibitions.js');
const logger = (await import('../services/logger.js')).default;

const ORDER = [{ position: 'asc' }, { id: 'asc' }];
const IMAGES_INCLUDE = { images: { orderBy: ORDER } };

describe('HU07 - Admin Exposiciones', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('listPublished', () => {
    describe('given exhibitions exist', () => {
      it('should return 200 with exhibitions ordered by position', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          { id: 1, title: 'Expo Uno', date: new Date('2024-06-01T00:00:00Z'), endDate: null, position: 0 },
          { id: 2, title: 'Expo Dos', date: new Date('2024-07-01T00:00:00Z'), endDate: new Date('2024-07-15T00:00:00Z'), position: 1 },
        ]);

        await listPublished(req, res);

        expect(mockPrisma.exhibition.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
          orderBy: ORDER,
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Expo Uno', date: '2024-06-01', endDate: null, position: 0, images: [] },
            { id: 2, title: 'Expo Dos', date: '2024-07-01', endDate: '2024-07-15', position: 1, images: [] },
          ],
        });
      });
    });

    describe('given exhibitions with images', () => {
      it('should serialize images ordered by position', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Expo Uno',
            date: new Date('2024-06-01T00:00:00Z'),
            endDate: null,
            position: 0,
            images: [
              { id: 10, url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1t.jpg', width: 800, height: 600, position: 0 },
              { id: 11, url: 'https://cdn/2.jpg', thumbnail: null, width: null, height: null, position: 1 },
            ],
          },
        ]);

        await listPublished(req, res);

        expect(res.json).toHaveBeenCalledWith({
          data: [
            {
              id: 1,
              title: 'Expo Uno',
              date: '2024-06-01',
              endDate: null,
              position: 0,
              images: [
                { id: 10, url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1t.jpg', width: 800, height: 600, position: 0 },
                { id: 11, url: 'https://cdn/2.jpg', thumbnail: null, width: null, height: null, position: 1 },
              ],
            },
          ],
        });
      });
    });

    describe('given no exhibitions', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.findMany.mockRejectedValue(new Error('DB Error'));

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
    describe('given exhibitions exist (published and unpublished)', () => {
      it('should return 200 with all exhibitions ordered by position', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          { id: 1, title: 'Expo Uno', date: new Date('2024-06-01T00:00:00Z'), endDate: null, position: 0, isPublished: true },
          { id: 2, title: 'Expo Dos', date: new Date('2024-07-01T00:00:00Z'), endDate: null, position: 1, isPublished: false },
        ]);

        await listAll(req, res);

        expect(mockPrisma.exhibition.findMany).toHaveBeenCalledWith({
          orderBy: ORDER,
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Expo Uno', date: '2024-06-01', endDate: null, position: 0, isPublished: true, images: [] },
            { id: 2, title: 'Expo Dos', date: '2024-07-01', endDate: null, position: 1, isPublished: false, images: [] },
          ],
        });
      });
    });

    describe('given no exhibitions', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given exhibitions with string dates', () => {
      it('should serialize date/endDate defensively from strings', async () => {
        mockPrisma.exhibition.findMany.mockResolvedValue([
          {
            id: 3,
            title: 'Expo String',
            date: '2024-06-01T00:00:00.000Z',
            endDate: '2024-06-30',
            position: 0,
            isPublished: true,
          },
        ]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            {
              id: 3,
              title: 'Expo String',
              date: '2024-06-01',
              endDate: '2024-06-30',
              position: 0,
              isPublished: true,
              images: [],
            },
          ],
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.findMany.mockRejectedValue(new Error('DB Error'));

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('create', () => {
    describe('given valid data', () => {
      it('should return 201 with created exhibition', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          location: 'Madrid',
          description: null,
          position: 0,
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          location: 'Madrid',
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: 'Madrid',
            description: null,
          },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Exposición 2024',
            date: '2024-06-01',
            endDate: null,
            location: 'Madrid',
            description: null,
            position: 0,
            images: [],
          },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given valid data with endDate', () => {
      it('should persist endDate and return it serialized', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          endDate: new Date('2024-06-30'),
          location: null,
          description: null,
          position: 0,
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          endDate: '2024-06-30',
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            endDate: new Date('2024-06-30'),
            location: null,
            description: null,
          },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Exposición 2024',
            date: '2024-06-01',
            endDate: '2024-06-30',
            location: null,
            description: null,
            position: 0,
            images: [],
          },
        });
      });
    });

    describe('given endDate null on create', () => {
      it('should not persist endDate', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          endDate: null,
          location: null,
          description: null,
          position: 0,
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          endDate: null,
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: null,
            description: null,
          },
          include: IMAGES_INCLUDE,
        });
      });
    });

    describe('given valid data with position', () => {
      it('should persist position', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          location: null,
          description: null,
          position: 5,
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          position: 5,
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: null,
            description: null,
            position: 5,
          },
          include: IMAGES_INCLUDE,
        });
      });
    });

    describe('given valid data with isPublished', () => {
      it('should persist isPublished', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          isPublished: false,
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          isPublished: false,
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: null,
            description: null,
            isPublished: false,
          },
          include: IMAGES_INCLUDE,
        });
      });
    });

    describe('given valid data with images', () => {
      it('should create nested images with position by array order', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Exposición 2024',
          date: new Date('2024-06-01'),
          location: null,
          description: null,
          position: 0,
          isPublished: true,
          images: [
            { id: 10, url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1t.jpg', width: 800, height: 600, position: 0 },
            { id: 11, url: 'https://cdn/2.jpg', thumbnail: null, width: null, height: null, position: 1 },
          ],
        });
        req.body = {
          title: 'Exposición 2024',
          date: '2024-06-01',
          images: [
            { url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1t.jpg', width: 800, height: 600 },
            { url: 'https://cdn/2.jpg' },
          ],
        };

        await create(req, res);

        expect(mockPrisma.exhibition.create).toHaveBeenCalledWith({
          data: {
            title: 'Exposición 2024',
            date: new Date('2024-06-01'),
            location: null,
            description: null,
            images: {
              create: [
                { url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1t.jpg', width: 800, height: 600, position: 0 },
                { url: 'https://cdn/2.jpg', position: 1 },
              ],
            },
          },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Exposición 2024',
            date: '2024-06-01',
            endDate: null,
            location: null,
            description: null,
            position: 0,
            isPublished: true,
            images: [
              { id: 10, url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1t.jpg', width: 800, height: 600, position: 0 },
              { id: 11, url: 'https://cdn/2.jpg', thumbnail: null, width: null, height: null, position: 1 },
            ],
          },
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.create.mockRejectedValue(new Error('DB Error'));
        req.body = { title: 'Test', date: '2024-06-01' };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('update', () => {
    describe('given valid data', () => {
      it('should return 200 with updated exhibition', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-06-01'),
          location: null,
          description: null,
        });
        req.params = { id: '1' };
        req.body = { title: 'Nuevo' };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Nuevo' },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Nuevo',
            date: '2024-06-01',
            endDate: null,
            location: null,
            description: null,
            images: [],
          },
        });
        expect(logger.info).toHaveBeenCalled();
      });

      it('should persist endDate when provided', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-06-01'),
          endDate: new Date('2024-06-30'),
        });
        req.params = { id: '1' };
        req.body = { endDate: '2024-06-30' };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { endDate: new Date('2024-06-30') },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Nuevo',
            date: '2024-06-01',
            endDate: '2024-06-30',
            images: [],
          },
        });
      });

      it('should clear endDate when null', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-06-01'),
          endDate: null,
        });
        req.params = { id: '1' };
        req.body = { endDate: null };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { endDate: null },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should update all optional fields', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-12-01'),
          location: 'Barcelona',
          description: 'Descripción',
        });
        req.params = { id: '1' };
        req.body = {
          title: 'Nuevo',
          date: '2024-12-01',
          location: 'Barcelona',
          description: 'Descripción',
        };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            title: 'Nuevo',
            date: new Date('2024-12-01'),
            location: 'Barcelona',
            description: 'Descripción',
          },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should persist position when provided', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-06-01'),
          position: 3,
        });
        req.params = { id: '1' };
        req.body = { position: 3 };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { position: 3 },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should persist isPublished when provided', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          date: new Date('2024-06-01'),
          isPublished: false,
        });
        req.params = { id: '1' };
        req.body = { isPublished: false };

        await update(req, res);

        expect(mockPrisma.exhibition.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { isPublished: false },
          include: IMAGES_INCLUDE,
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('given images are provided', () => {
      it('should replace images in a transaction and reload the exhibition', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({ id: 1 });
        mockPrisma.exhibitionImage.deleteMany.mockResolvedValue({ count: 1 });
        mockPrisma.exhibitionImage.createMany.mockResolvedValue({ count: 2 });
        mockPrisma.exhibition.findUnique.mockResolvedValue({
          id: 1,
          title: 'Expo',
          date: new Date('2024-06-01'),
          endDate: null,
          location: null,
          description: null,
          position: 0,
          isPublished: true,
          images: [
            { id: 20, url: 'https://cdn/a.jpg', thumbnail: 'https://cdn/at.jpg', width: 100, height: 50, position: 0 },
            { id: 21, url: 'https://cdn/b.jpg', thumbnail: null, width: null, height: null, position: 1 },
          ],
        });
        req.params = { id: '1' };
        req.body = { images: [{ url: 'https://cdn/a.jpg' }, { url: 'https://cdn/b.jpg' }] };

        await update(req, res);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
        expect(mockPrisma.exhibitionImage.deleteMany).toHaveBeenCalledWith({
          where: { exhibitionId: 1 },
        });
        expect(mockPrisma.exhibitionImage.createMany).toHaveBeenCalledWith({
          data: [
            { url: 'https://cdn/a.jpg', exhibitionId: 1, position: 0 },
            { url: 'https://cdn/b.jpg', exhibitionId: 1, position: 1 },
          ],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Expo',
            date: '2024-06-01',
            endDate: null,
            location: null,
            description: null,
            position: 0,
            isPublished: true,
            images: [
              { id: 20, url: 'https://cdn/a.jpg', thumbnail: 'https://cdn/at.jpg', width: 100, height: 50, position: 0 },
              { id: 21, url: 'https://cdn/b.jpg', thumbnail: null, width: null, height: null, position: 1 },
            ],
          },
        });
      });

      it('should clear images when an empty array is provided', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({ id: 1 });
        mockPrisma.exhibitionImage.deleteMany.mockResolvedValue({ count: 2 });
        mockPrisma.exhibitionImage.createMany.mockResolvedValue({ count: 0 });
        mockPrisma.exhibition.findUnique.mockResolvedValue({
          id: 1,
          title: 'Expo',
          date: new Date('2024-06-01'),
          endDate: null,
          location: null,
          description: null,
          position: 0,
          isPublished: true,
          images: [],
        });
        req.params = { id: '1' };
        req.body = { images: [] };

        await update(req, res);

        expect(mockPrisma.exhibitionImage.deleteMany).toHaveBeenCalledWith({
          where: { exhibitionId: 1 },
        });
        expect(mockPrisma.exhibitionImage.createMany).toHaveBeenCalledWith({ data: [] });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Expo',
            date: '2024-06-01',
            endDate: null,
            location: null,
            description: null,
            position: 0,
            isPublished: true,
            images: [],
          },
        });
      });

      it('should return 404 when the exhibition does not exist', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.update.mockRejectedValue(notFoundError);
        req.params = { id: '999' };
        req.body = { images: [{ url: 'https://cdn/a.jpg' }] };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Exposición no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given exhibition does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.update.mockRejectedValue(notFoundError);
        req.params = { id: '999' };
        req.body = { title: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Exposición no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.update.mockRejectedValue(new Error('DB Error'));
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
    describe('given existing exhibition', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.exhibition.delete.mockResolvedValue({ id: 1 });
        req.params = { id: '1' };

        await remove(req, res);

        expect(mockPrisma.exhibition.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Exposición eliminada correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given exhibition does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to delete does not exist');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.delete.mockRejectedValue(notFoundError);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Exposición no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.delete.mockRejectedValue(new Error('DB Error'));
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
        mockPrisma.exhibition.update.mockResolvedValue({ id: 2, position: 0 });
        req.body = { orderedIds: [2, 1] };

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
        mockPrisma.exhibition.update.mockRejectedValue(notFoundError);
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
        mockPrisma.exhibition.update.mockRejectedValue(new Error('DB Error'));
        req.body = { orderedIds: [1, 2] };

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

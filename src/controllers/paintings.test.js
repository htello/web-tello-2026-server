/**
 * @fileoverview Tests unitarios del controller de pinturas.
 *
 * Cubre HU06 - Admin Pinturas: create, update, remove, feature, publish, reorder.
 *
 * @module controllers/paintings.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/upload.js', () => ({
  resolveImageUrl: vi.fn(),
  resolveImageAsset: vi.fn(),
  ALLOWED_SECTIONS: ['pintura', 'ilustracion', 'diseno', 'general'],
}));

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../services/cloudinary.js', () => ({
  deleteCloudinaryImage: vi.fn(),
  extractPublicId: vi.fn(() => null),
}));

const { create, update, remove, reorder, getById, getFeatured, listPublished, listAll } = await import('./paintings.js');
const { resolveImageUrl, resolveImageAsset } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;
const { deleteCloudinaryImage, extractPublicId } = await import('../services/cloudinary.js');

describe('HU06 - Admin Pinturas', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, file: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
    extractPublicId.mockReturnValue(null);
    deleteCloudinaryImage.mockResolvedValue(undefined);
    resolveImageUrl.mockImplementation(async (_file, imageUrl) => imageUrl);
    resolveImageAsset.mockImplementation(async (file, imageUrl, section) => ({
      url: await resolveImageUrl(file, imageUrl, section),
      publicId: null,
    }));
  });

  describe('create', () => {
    describe('given valid data with imageUrl', () => {
      it('should return 201 with created painting', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockResolvedValue({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collectionId: 1,
        });
        req.body = {
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collectionId: 1,
          dimensions: '80x60 cm',
          technique: 'Óleo sobre lienzo',
          year: 2024,
        };

        await create(req, res);

        expect(mockPrisma.collection.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(mockPrisma.painting.create).toHaveBeenCalledWith({
          data: {
            title: 'Atardecer',
            imageUrl: 'https://example.com/painting.jpg',
            collectionId: 1,
            dimensions: '80x60 cm',
            technique: 'Óleo sobre lienzo',
            year: 2024,
          },
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ id: 1, title: 'Atardecer' }),
          })
        );
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given valid data with isPublished and isFeatured', () => {
      it('should persist isPublished and isFeatured', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockResolvedValue({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collectionId: 1,
          isPublished: false,
          isFeatured: true,
        });
        req.body = {
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collectionId: 1,
          isPublished: false,
          isFeatured: true,
        };

        await create(req, res);

        expect(mockPrisma.painting.create).toHaveBeenCalledWith({
          data: {
            title: 'Atardecer',
            imageUrl: 'https://example.com/painting.jpg',
            collectionId: 1,
            dimensions: null,
            technique: null,
            year: null,
            isPublished: false,
            isFeatured: true,
          },
        });
      });
    });

    describe('given a file upload', () => {
      it('should upload to Cloudinary and use returned url', async () => {
        resolveImageUrl.mockResolvedValue('https://cloudinary.com/p.jpg');
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockResolvedValue({
          id: 2,
          title: 'Con archivo',
          imageUrl: 'https://cloudinary.com/p.jpg',
          collectionId: 1,
        });
        req.file = { originalname: 'p.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
        req.body = { title: 'Con archivo', collectionId: 1 };

        await create(req, res);

        expect(resolveImageUrl).toHaveBeenCalledWith(req.file, undefined, 'pintura');
        expect(mockPrisma.painting.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ imageUrl: 'https://cloudinary.com/p.jpg' }),
          })
        );
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('given no image file and no imageUrl', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        req.body = { title: 'Sin imagen', collectionId: 1 };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'La imagen es obligatoria (archivo o URL)',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given non-existent collection', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue(null);
        req.body = {
          title: 'Pintura',
          imageUrl: 'https://example.com/p.jpg',
          collectionId: 999,
        };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'La colección no existe',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given duplicate title in collection', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.painting.create.mockRejectedValue(dupError);
        req.body = { title: 'Atardecer', imageUrl: 'https://example.com/p.jpg', collectionId: 1 };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe una pintura con ese título en esta colección',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockRejectedValue(new Error('DB Error'));
        req.body = { title: 'Pintura', imageUrl: 'https://example.com/p.jpg', collectionId: 1 };

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

  it('should persist the public id for a Cloudinary image', async () => {
    resolveImageAsset.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/new.jpg',
      publicId: 'portfolio/new',
    });
    mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.painting.create.mockResolvedValue({ id: 1, imageUrl: 'https://res.cloudinary.com/demo/new.jpg' });
    req.body = { title: 'Nueva', imageUrl: 'https://res.cloudinary.com/demo/new.jpg', collectionId: 1 };

    await create(req, res);

    expect(mockPrisma.painting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imagePublicId: 'portfolio/new' }),
    });
  });

  it('should persist the public id returned by the upload asset', async () => {
    resolveImageAsset.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/new.jpg',
      publicId: 'portfolio-antonio-tello/pintura/new-123',
    });
    mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.painting.create.mockResolvedValue({ id: 1 });
    req.file = { originalname: 'new.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
    req.body = { title: 'Nueva', collectionId: 1 };

    await create(req, res);

    expect(mockPrisma.painting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imagePublicId: 'portfolio-antonio-tello/pintura/new-123' }),
    });
  });

  describe('update', () => {
    describe('given valid data', () => {
      it('should return 200 with updated painting', async () => {
        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          imageUrl: 'https://example.com/p.jpg',
          collectionId: 1,
        });
        req.params = { id: '1' };
        req.body = { title: 'Nuevo' };

        await update(req, res);

        expect(mockPrisma.painting.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Nuevo' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should upload new image when file is present', async () => {
        resolveImageUrl.mockResolvedValue('https://cloudinary.com/nuevo.jpg');
        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          imageUrl: 'https://cloudinary.com/nuevo.jpg',
          collectionId: 1,
        });
        req.params = { id: '1' };
        req.file = { originalname: 'n.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
        req.body = { title: 'Actualizada' };

        await update(req, res);

        expect(resolveImageUrl).toHaveBeenCalledWith(req.file, undefined, 'pintura');
        expect(mockPrisma.painting.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Actualizada', imageUrl: 'https://cloudinary.com/nuevo.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should persist the public id when updating with a Cloudinary URL', async () => {
        resolveImageAsset.mockResolvedValue({
          url: 'https://res.cloudinary.com/demo/new.jpg',
          publicId: 'portfolio/new',
        });
        mockPrisma.painting.update.mockResolvedValue({ id: 1, imageUrl: 'https://res.cloudinary.com/demo/new.jpg' });
        req.params = { id: '1' };
        req.body = { imageUrl: 'https://res.cloudinary.com/demo/new.jpg' };

        await update(req, res);

        expect(mockPrisma.painting.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: expect.objectContaining({ imagePublicId: 'portfolio/new' }),
        });
      });

      it('should reject removing the image without a replacement', async () => {
        req.params = { id: '1' };
        req.body = { imageUrl: null };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'La imagen es obligatoria (archivo o URL)',
          code: 'VALIDATION_ERROR',
        });
        expect(mockPrisma.painting.update).not.toHaveBeenCalled();
        expect(deleteCloudinaryImage).not.toHaveBeenCalled();
      });
    });

    it('should delete the previous image when updating the image', async () => {
      mockPrisma.painting.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/old.jpg',
        imagePublicId: 'portfolio/old',
      });
      mockPrisma.painting.update.mockResolvedValue({ id: 1, imageUrl: 'https://example.com/new.jpg' });
      req.params = { id: '1' };
      req.body = { imageUrl: 'https://example.com/new.jpg' };

      await update(req, res);

      expect(deleteCloudinaryImage).toHaveBeenCalledWith('portfolio/old', expect.any(String));
    });

    describe('given isPublished and isFeatured', () => {
      it('should persist isPublished and isFeatured', async () => {
        mockPrisma.painting.update.mockResolvedValue({ id: 1, isPublished: true, isFeatured: false });
        req.params = { id: '1' };
        req.body = { isPublished: true, isFeatured: false };

        await update(req, res);

        expect(mockPrisma.painting.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { isPublished: true, isFeatured: false },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('given painting does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to update not found');
        error.code = 'P2025';
        mockPrisma.painting.update.mockRejectedValue(error);
        req.params = { id: '999' };
        req.body = { title: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Pintura no encontrada',
          code: 'NOT_FOUND',
        });
      });

      it('should return 404 when the painting lookup returns null', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue(null);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.painting.update.mockRejectedValue(dupError);
        req.params = { id: '1' };
        req.body = { title: 'Atardecer' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe una pintura con ese título en esta colección',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.update.mockRejectedValue(new Error('DB Error'));
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
    describe('given existing painting', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue(undefined);
        mockPrisma.painting.delete.mockResolvedValue({ id: 1 });
        req.params = { id: '1' };

        await remove(req, res);

        expect(mockPrisma.painting.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Pintura eliminada correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    it('should delete the Cloudinary image before the painting', async () => {
      mockPrisma.painting.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/obra.jpg',
        imagePublicId: 'portfolio/obra',
      });
      mockPrisma.painting.delete.mockResolvedValue({ id: 1 });
      req.params = { id: '1' };

      await remove(req, res);

      expect(deleteCloudinaryImage).toHaveBeenCalledWith('portfolio/obra', expect.any(String));
      expect(mockPrisma.painting.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should preserve the painting when Cloudinary deletion fails', async () => {
      mockPrisma.painting.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/obra.jpg',
        imagePublicId: 'portfolio/missing',
      });
      deleteCloudinaryImage.mockRejectedValue(new Error('Cloudinary no eliminó la imagen'));
      req.params = { id: '1' };

      await remove(req, res);

      expect(mockPrisma.painting.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    });

    describe('given painting does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to delete does not exist');
        error.code = 'P2025';
        mockPrisma.painting.delete.mockRejectedValue(error);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Pintura no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.delete.mockRejectedValue(new Error('DB Error'));
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

  describe('getById', () => {
    describe('given an existing painting', () => {
      it('should return 200 with the painting and its collection', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://example.com/painting.jpg',
          collection: { id: 3, title: 'Colección Uno' },
        });
        req.params = { id: '1' };

        await getById(req, res);

        expect(mockPrisma.painting.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: { collection: { select: { id: true, title: true } } },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: {
            id: 1,
            title: 'Atardecer',
            imageUrl: 'https://example.com/painting.jpg',
            collection: { id: 3, title: 'Colección Uno' },
          },
        });
      });
    });

    describe('given a non-existent painting', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue(null);
        req.params = { id: '999' };

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Pintura no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findUnique.mockRejectedValue(new Error('DB Error'));
        req.params = { id: '1' };

        await getById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('getFeatured', () => {
    describe('given featured published paintings', () => {
      it('should return 200 with an array including collection', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Atardecer',
            imageUrl: 'https://example.com/1.jpg',
            collection: { id: 3, title: 'Colección Uno' },
          },
        ]);

        await getFeatured(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith({
          where: { isFeatured: true, isPublished: true },
          include: { collection: { select: { id: true, title: true } } },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            {
              id: 1,
              title: 'Atardecer',
              imageUrl: 'https://example.com/1.jpg',
              collection: { id: 3, title: 'Colección Uno' },
            },
          ],
        });
      });
    });

    describe('given no featured paintings', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([]);

        await getFeatured(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findMany.mockRejectedValue(new Error('DB Error'));

        await getFeatured(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('listPublished', () => {
    describe('given published paintings', () => {
      it('should return 200 with an array including collection', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Atardecer',
            imageUrl: 'https://example.com/1.jpg',
            collection: { id: 3, title: 'Colección Uno' },
          },
        ]);

        await listPublished(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: { collection: { select: { id: true, title: true } } },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            {
              id: 1,
              title: 'Atardecer',
              imageUrl: 'https://example.com/1.jpg',
              collection: { id: 3, title: 'Colección Uno' },
            },
          ],
        });
      });
    });

    describe('given no published paintings', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findMany.mockRejectedValue(new Error('DB Error'));

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
    describe('given paintings exist (published and unpublished)', () => {
      it('should return 200 with paginated paintings including collection', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([
          {
            id: 1,
            title: 'Atardecer',
            imageUrl: 'https://example.com/1.jpg',
            isPublished: true,
            collection: { id: 3, title: 'Colección Uno' },
          },
          {
            id: 2,
            title: 'Borrador',
            imageUrl: 'https://example.com/2.jpg',
            isPublished: false,
            collection: { id: 3, title: 'Colección Uno' },
          },
        ]);
        mockPrisma.painting.count.mockResolvedValue(2);

        await listAll(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 20,
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: { collection: { select: { id: true, title: true } } },
        });
        expect(mockPrisma.painting.count).toHaveBeenCalledWith();
        expect(res.status).toHaveBeenCalledWith(200);
        const { data, meta } = res.json.mock.calls[0][0];
        expect(data).toHaveLength(2);
        expect(data[1]).toMatchObject({ id: 2, isPublished: false });
        expect(meta).toEqual({ total: 2, page: 1, limit: 20, pages: 1 });
      });
    });

    describe('given pagination query params', () => {
      it('should apply page and limit and return meta', async () => {
        req.query = { page: '2', limit: '5' };
        mockPrisma.painting.findMany.mockResolvedValue([]);
        mockPrisma.painting.count.mockResolvedValue(7);

        await listAll(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ skip: 5, take: 5 })
        );
        expect(res.json).toHaveBeenCalledWith({
          data: [],
          meta: { total: 7, page: 2, limit: 5, pages: 2 },
        });
      });

      it('should cap limit at 100', async () => {
        req.query = { limit: '500' };
        mockPrisma.painting.findMany.mockResolvedValue([]);
        mockPrisma.painting.count.mockResolvedValue(0);

        await listAll(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ skip: 0, take: 100 })
        );
      });
    });

    describe('given no paintings', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.painting.findMany.mockResolvedValue([]);
        mockPrisma.painting.count.mockResolvedValue(0);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [],
          meta: { total: 0, page: 1, limit: 20, pages: 0 },
        });
      });
    });

    describe('given collectionId query param', () => {
      it('should filter findMany and count by collectionId', async () => {
        req.query = { collectionId: '3' };
        mockPrisma.painting.findMany.mockResolvedValue([]);
        mockPrisma.painting.count.mockResolvedValue(0);

        await listAll(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 20,
          where: { collectionId: 3 },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          include: { collection: { select: { id: true, title: true } } },
        });
        expect(mockPrisma.painting.count).toHaveBeenCalledWith({ where: { collectionId: 3 } });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should ignore an empty collectionId', async () => {
        req.query = { collectionId: '' };
        mockPrisma.painting.findMany.mockResolvedValue([]);
        mockPrisma.painting.count.mockResolvedValue(0);

        await listAll(req, res);

        expect(mockPrisma.painting.findMany).toHaveBeenCalledWith(
          expect.not.objectContaining({ where: expect.anything() })
        );
        expect(mockPrisma.painting.count).toHaveBeenCalledWith();
      });

      it('should return 400 VALIDATION_ERROR for a non-numeric collectionId', async () => {
        req.query = { collectionId: 'abc' };

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'El collectionId debe ser un entero positivo',
          code: 'VALIDATION_ERROR',
        });
        expect(mockPrisma.painting.findMany).not.toHaveBeenCalled();
      });

      it('should return 400 VALIDATION_ERROR for a non-positive collectionId', async () => {
        req.query = { collectionId: '0' };

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'El collectionId debe ser un entero positivo',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findMany.mockRejectedValue(new Error('DB Error'));

        await listAll(req, res);

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
        mockPrisma.painting.update.mockResolvedValue({ id: 2, position: 0 });
        req.body = { orderedIds: [2, 1], collectionId: 1 };

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
        mockPrisma.painting.update.mockRejectedValue(notFoundError);
        req.body = { orderedIds: [999], collectionId: 1 };

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
        mockPrisma.painting.update.mockRejectedValue(new Error('DB Error'));
        req.body = { orderedIds: [1, 2], collectionId: 1 };

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

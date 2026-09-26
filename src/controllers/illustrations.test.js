/**
 * @fileoverview Tests unitarios del controller de ilustraciones.
 *
 * Cubre HU08 - Admin Ilustraciones: create, update, remove, reorder.
 *
 * @module controllers/illustrations.test
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

const { create, update, remove, reorder, listPublished, listAll, listFeatured } = await import('./illustrations.js');
const { resolveImageUrl, resolveImageAsset } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;
const { deleteCloudinaryImage, extractPublicId } = await import('../services/cloudinary.js');

describe('HU08 - Admin Ilustraciones', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, file: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
    extractPublicId.mockReturnValue(null);
    resolveImageUrl.mockImplementation(async (_file, imageUrl) => imageUrl);
    resolveImageAsset.mockImplementation(async (file, imageUrl, section) => ({
      url: await resolveImageUrl(file, imageUrl, section),
      publicId: null,
    }));
  });

  describe('listPublished', () => {
    describe('given illustrations exist', () => {
      it('should return 200 with all illustrations', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([
          { id: 1, title: 'Bosque Encantado', imageUrl: 'https://example.com/a.jpg' },
          { id: 2, title: 'Dragón', imageUrl: 'https://example.com/b.jpg' },
        ]);

        await listPublished(req, res);

        expect(mockPrisma.illustration.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Bosque Encantado', imageUrl: 'https://example.com/a.jpg' },
            { id: 2, title: 'Dragón', imageUrl: 'https://example.com/b.jpg' },
          ],
        });
      });
    });

    describe('given no illustrations', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([]);

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.findMany.mockRejectedValue(new Error('DB Error'));

        await listPublished(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('listAll', () => {
    describe('given illustrations exist (published and unpublished)', () => {
      it('should return 200 with all illustrations without published filter', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([
          { id: 1, title: 'Bosque Encantado', imageUrl: 'https://example.com/a.jpg', isPublished: true },
          { id: 2, title: 'Dragón', imageUrl: 'https://example.com/b.jpg', isPublished: false },
        ]);

        await listAll(req, res);

        expect(mockPrisma.illustration.findMany).toHaveBeenCalledWith({
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Bosque Encantado', imageUrl: 'https://example.com/a.jpg', isPublished: true },
            { id: 2, title: 'Dragón', imageUrl: 'https://example.com/b.jpg', isPublished: false },
          ],
        });
      });
    });

    describe('given no illustrations', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.findMany.mockRejectedValue(new Error('DB Error'));

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('listFeatured', () => {
    describe('given featured published illustrations', () => {
      it('should return 200 with featured illustrations', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([
          { id: 1, title: 'Bosque', isFeatured: true },
        ]);

        await listFeatured(req, res);

        expect(mockPrisma.illustration.findMany).toHaveBeenCalledWith({
          where: { isFeatured: true, isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [{ id: 1, title: 'Bosque', isFeatured: true }],
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.findMany.mockRejectedValue(new Error('DB Error'));

        await listFeatured(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('create', () => {
    describe('given valid data with imageUrl', () => {
      it('should return 201 with created illustration', async () => {
        mockPrisma.illustration.create.mockResolvedValue({
          id: 1,
          title: 'Ilustración',
          description: 'Desc',
          imageUrl: 'https://example.com/i.jpg',
        });
        req.body = {
          title: 'Ilustración',
          description: 'Desc',
          imageUrl: 'https://example.com/i.jpg',
        };

        await create(req, res);

        expect(mockPrisma.illustration.create).toHaveBeenCalledWith({
          data: {
            title: 'Ilustración',
            description: 'Desc',
            imageUrl: 'https://example.com/i.jpg',
          },
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ id: 1, title: 'Ilustración' }),
          })
        );
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given valid data with isPublished and isFeatured', () => {
      it('should persist isPublished and isFeatured', async () => {
        mockPrisma.illustration.create.mockResolvedValue({
          id: 1,
          title: 'Ilustración',
          imageUrl: 'https://example.com/i.jpg',
          isPublished: false,
          isFeatured: true,
        });
        req.body = {
          title: 'Ilustración',
          imageUrl: 'https://example.com/i.jpg',
          isPublished: false,
          isFeatured: true,
        };

        await create(req, res);

        expect(mockPrisma.illustration.create).toHaveBeenCalledWith({
          data: {
            title: 'Ilustración',
            description: null,
            imageUrl: 'https://example.com/i.jpg',
            isPublished: false,
            isFeatured: true,
          },
        });
      });
    });

    describe('given a file upload', () => {
      it('should upload to Cloudinary and use returned url', async () => {
        resolveImageUrl.mockResolvedValue('https://cloudinary.com/i.jpg');
        mockPrisma.illustration.create.mockResolvedValue({
          id: 2,
          title: 'Con archivo',
          imageUrl: 'https://cloudinary.com/i.jpg',
        });
        req.file = { originalname: 'i.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
        req.body = { title: 'Con archivo' };

        await create(req, res);

        expect(resolveImageUrl).toHaveBeenCalledWith(req.file, undefined, 'ilustracion');
        expect(mockPrisma.illustration.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ imageUrl: 'https://cloudinary.com/i.jpg' }),
          })
        );
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('given no image file and no imageUrl', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        req.body = { title: 'Sin imagen' };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'La imagen es obligatoria (archivo o URL)',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given duplicate title', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.illustration.create.mockRejectedValue(dupError);
        req.body = { title: 'Ilustración', imageUrl: 'https://example.com/i.jpg' };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe una ilustración con ese título',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.create.mockRejectedValue(new Error('DB Error'));
        req.body = { title: 'Ilustración', imageUrl: 'https://example.com/i.jpg' };

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
    extractPublicId.mockReturnValue('portfolio/new');
    mockPrisma.illustration.create.mockResolvedValue({ id: 1, imageUrl: 'https://res.cloudinary.com/demo/new.jpg' });
    req.body = { title: 'Nueva', imageUrl: 'https://res.cloudinary.com/demo/new.jpg' };

    await create(req, res);

    expect(mockPrisma.illustration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imagePublicId: 'portfolio/new' }),
    });
  });

  it('should persist the public id returned by the upload asset', async () => {
    resolveImageAsset.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/new.jpg',
      publicId: 'portfolio/new-real-id',
    });
    mockPrisma.illustration.create.mockResolvedValue({ id: 1 });
    req.file = { buffer: Buffer.from('image') };
    req.body = { title: 'Nueva' };

    await create(req, res);

    expect(mockPrisma.illustration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imagePublicId: 'portfolio/new-real-id' }),
    });
  });

  describe('update', () => {
    describe('given valid data', () => {
      it('should return 200 with updated illustration', async () => {
        mockPrisma.illustration.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          description: 'Nueva desc',
          imageUrl: 'https://example.com/i.jpg',
        });
        req.params = { id: '1' };
        req.body = {
          title: 'Nuevo',
          description: 'Nueva desc',
          imageUrl: 'https://example.com/i.jpg',
        };

        await update(req, res);

        expect(mockPrisma.illustration.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            title: 'Nuevo',
            description: 'Nueva desc',
            imageUrl: 'https://example.com/i.jpg',
          },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should upload new image when file is present', async () => {
        resolveImageUrl.mockResolvedValue('https://cloudinary.com/nuevo.jpg');
        mockPrisma.illustration.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          imageUrl: 'https://cloudinary.com/nuevo.jpg',
        });
        req.params = { id: '1' };
        req.file = { originalname: 'n.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
        req.body = { title: 'Actualizada' };

        await update(req, res);

        expect(resolveImageUrl).toHaveBeenCalledWith(req.file, undefined, 'ilustracion');
        expect(mockPrisma.illustration.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Actualizada', imageUrl: 'https://cloudinary.com/nuevo.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should persist the public id when updating with a Cloudinary URL', async () => {
        extractPublicId.mockReturnValue('portfolio/new');
        mockPrisma.illustration.update.mockResolvedValue({ id: 1, imageUrl: 'https://res.cloudinary.com/demo/new.jpg' });
        req.params = { id: '1' };
        req.body = { imageUrl: 'https://res.cloudinary.com/demo/new.jpg' };

        await update(req, res);

        expect(mockPrisma.illustration.update).toHaveBeenCalledWith({
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
        expect(mockPrisma.illustration.update).not.toHaveBeenCalled();
        expect(deleteCloudinaryImage).not.toHaveBeenCalled();
      });
    });

    it('should delete the previous image when updating the image', async () => {
      mockPrisma.illustration.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/old.jpg',
        imagePublicId: 'portfolio/old',
      });
      mockPrisma.illustration.update.mockResolvedValue({ id: 1, imageUrl: 'https://example.com/new.jpg' });
      req.params = { id: '1' };
      req.body = { imageUrl: 'https://example.com/new.jpg' };

      await update(req, res);

      expect(deleteCloudinaryImage).toHaveBeenCalledWith('portfolio/old', expect.any(String));
    });

    describe('given isPublished and isFeatured', () => {
      it('should persist isPublished and isFeatured', async () => {
        mockPrisma.illustration.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          isPublished: true,
          isFeatured: false,
        });
        req.params = { id: '1' };
        req.body = { isPublished: true, isFeatured: false };

        await update(req, res);

        expect(mockPrisma.illustration.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { isPublished: true, isFeatured: false },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('given illustration does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.illustration.update.mockRejectedValue(notFoundError);
        req.params = { id: '999' };
        req.body = { title: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ilustración no encontrada',
          code: 'NOT_FOUND',
        });
      });

      it('should return 404 when the illustration lookup returns null', async () => {
        mockPrisma.illustration.findUnique.mockResolvedValue(null);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.illustration.update.mockRejectedValue(dupError);
        req.params = { id: '1' };
        req.body = { title: 'Ilustración' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe una ilustración con ese título',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.update.mockRejectedValue(new Error('DB Error'));
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
    describe('given existing illustration', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.illustration.findUnique.mockResolvedValue(undefined);
        mockPrisma.illustration.delete.mockResolvedValue({ id: 1 });
        req.params = { id: '1' };

        await remove(req, res);

        expect(mockPrisma.illustration.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Ilustración eliminada correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    it('should delete the Cloudinary image before the illustration', async () => {
      mockPrisma.illustration.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/obra.jpg',
        imagePublicId: 'portfolio/obra',
      });
      mockPrisma.illustration.delete.mockResolvedValue({ id: 1 });
      req.params = { id: '1' };

      await remove(req, res);

      expect(deleteCloudinaryImage).toHaveBeenCalledWith('portfolio/obra', expect.any(String));
      expect(mockPrisma.illustration.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    describe('given illustration does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to delete does not exist');
        notFoundError.code = 'P2025';
        mockPrisma.illustration.delete.mockRejectedValue(notFoundError);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ilustración no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.delete.mockRejectedValue(new Error('DB Error'));
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
        mockPrisma.illustration.update.mockResolvedValue({ id: 2, position: 0 });
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
        mockPrisma.illustration.update.mockRejectedValue(notFoundError);
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
        mockPrisma.illustration.update.mockRejectedValue(new Error('DB Error'));
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

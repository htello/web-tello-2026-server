/**
 * @fileoverview Tests unitarios del controller de proyectos de diseño.
 *
 * Cubre HU09 - Admin Diseño: create, update, remove, reorder.
 *
 * @module controllers/design.test
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

const { create, update, remove, reorder, listAll, listFiltered, listFeatured } = await import('./design.js');
const { resolveImageUrl, resolveImageAsset } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;
const { deleteCloudinaryImage, extractPublicId } = await import('../services/cloudinary.js');

describe('HU09 - Admin Diseño', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, file: null };
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

  describe('listAll', () => {
    describe('given projects exist (published and unpublished)', () => {
      it('should return 200 with all projects without published filter', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([
          { id: 1, title: 'Proyecto A', subcategory: 'imagen-corporativa', isPublished: true },
          { id: 2, title: 'Proyecto B', subcategory: 'editorial', isPublished: false },
        ]);

        await listAll(req, res);

        expect(mockPrisma.designProject.findMany).toHaveBeenCalledWith({
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Proyecto A', subcategory: 'imagen-corporativa', isPublished: true },
            { id: 2, title: 'Proyecto B', subcategory: 'editorial', isPublished: false },
          ],
        });
      });
    });

    describe('given no projects', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([]);

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.findMany.mockRejectedValue(new Error('DB Error'));

        await listAll(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('listFiltered', () => {
    describe('given no subcategory', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        req.query = {};

        await listFiltered(req, res);

        expect(mockPrisma.designProject.findMany).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'La subcategoría es obligatoria',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given a subcategory', () => {
      it('should return 200 with filtered projects', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([
          { id: 1, title: 'Proyecto A', subcategory: 'imagen-corporativa' },
        ]);
        req.query = { subcategory: 'imagen-corporativa' };

        await listFiltered(req, res);

        expect(mockPrisma.designProject.findMany).toHaveBeenCalledWith({
          where: { subcategory: 'imagen-corporativa', isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [{ id: 1, title: 'Proyecto A', subcategory: 'imagen-corporativa' }],
        });
      });
    });

    describe('given a subcategory with no matches', () => {
      it('should return 200 with an empty array', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([]);
        req.query = { subcategory: 'packaging-expositores' };

        await listFiltered(req, res);

        expect(mockPrisma.designProject.findMany).toHaveBeenCalledWith({
          where: { subcategory: 'packaging-expositores', isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [] });
      });
    });

    describe('given an invalid subcategory', () => {
      it('should return 404 NOT_FOUND', async () => {
        req.query = { subcategory: 'COSA' };

        await listFiltered(req, res);

        expect(mockPrisma.designProject.findMany).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Subcategoría inválida',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.findMany.mockRejectedValue(new Error('DB Error'));
        req.query = { subcategory: 'editorial' };

        await listFiltered(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('listFeatured', () => {
    describe('given featured published projects', () => {
      it('should return 200 with featured projects', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([
          { id: 1, title: 'Proyecto A', isFeatured: true },
        ]);

        await listFeatured(req, res);

        expect(mockPrisma.designProject.findMany).toHaveBeenCalledWith({
          where: { isFeatured: true, isPublished: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [{ id: 1, title: 'Proyecto A', isFeatured: true }],
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.findMany.mockRejectedValue(new Error('DB Error'));

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
      it('should return 201 with created project', async () => {
        mockPrisma.designProject.create.mockResolvedValue({
          id: 1,
          title: 'Proyecto',
          description: 'Desc',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'LOGO',
        });
        req.body = {
          title: 'Proyecto',
          description: 'Desc',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'LOGO',
        };

        await create(req, res);

        expect(mockPrisma.designProject.create).toHaveBeenCalledWith({
          data: {
            title: 'Proyecto',
            description: 'Desc',
            imageUrl: 'https://example.com/d.jpg',
            subcategory: 'LOGO',
          },
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ id: 1, title: 'Proyecto' }),
          })
        );
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given valid data with isPublished and isFeatured', () => {
      it('should persist isPublished and isFeatured', async () => {
        mockPrisma.designProject.create.mockResolvedValue({
          id: 1,
          title: 'Proyecto',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'imagen-corporativa',
          isPublished: false,
          isFeatured: true,
        });
        req.body = {
          title: 'Proyecto',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'imagen-corporativa',
          isPublished: false,
          isFeatured: true,
        };

        await create(req, res);

        expect(mockPrisma.designProject.create).toHaveBeenCalledWith({
          data: {
            title: 'Proyecto',
            description: null,
            imageUrl: 'https://example.com/d.jpg',
            subcategory: 'imagen-corporativa',
            isPublished: false,
            isFeatured: true,
          },
        });
      });
    });

    describe('given a file upload', () => {
      it('should upload to Cloudinary and use returned url', async () => {
        resolveImageUrl.mockResolvedValue('https://cloudinary.com/d.jpg');
        mockPrisma.designProject.create.mockResolvedValue({
          id: 2,
          title: 'Con archivo',
          imageUrl: 'https://cloudinary.com/d.jpg',
          subcategory: 'LOGO',
        });
        req.file = { originalname: 'd.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
        req.body = { title: 'Con archivo', subcategory: 'LOGO' };

        await create(req, res);

        expect(resolveImageUrl).toHaveBeenCalledWith(req.file, undefined, 'diseno');
        expect(mockPrisma.designProject.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ imageUrl: 'https://cloudinary.com/d.jpg' }),
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
        mockPrisma.designProject.create.mockRejectedValue(dupError);
        req.body = {
          title: 'Proyecto',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'LOGO',
        };

        await create(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe un proyecto de diseño con ese título',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.create.mockRejectedValue(new Error('DB Error'));
        req.body = {
          title: 'Proyecto',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'LOGO',
        };

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
    mockPrisma.designProject.create.mockResolvedValue({ id: 1, imageUrl: 'https://res.cloudinary.com/demo/new.jpg' });
    req.body = { title: 'Nuevo', imageUrl: 'https://res.cloudinary.com/demo/new.jpg', subcategory: 'LOGO' };

    await create(req, res);

    expect(mockPrisma.designProject.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imagePublicId: 'portfolio/new' }),
    });
  });

  it('should persist the public id returned by the upload asset', async () => {
    resolveImageAsset.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/new.jpg',
      publicId: 'portfolio/new-real-id',
    });
    mockPrisma.designProject.create.mockResolvedValue({ id: 1 });
    req.file = { buffer: Buffer.from('image') };
    req.body = { title: 'Nuevo', subcategory: 'LOGO' };

    await create(req, res);

    expect(mockPrisma.designProject.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imagePublicId: 'portfolio/new-real-id' }),
    });
  });

  describe('update', () => {
    describe('given valid data', () => {
      it('should return 200 with updated project', async () => {
        mockPrisma.designProject.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          description: 'Nueva desc',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'LANDING',
        });
        req.params = { id: '1' };
        req.body = {
          title: 'Nuevo',
          description: 'Nueva desc',
          imageUrl: 'https://example.com/d.jpg',
          subcategory: 'LANDING',
        };

        await update(req, res);

        expect(mockPrisma.designProject.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            title: 'Nuevo',
            description: 'Nueva desc',
            imageUrl: 'https://example.com/d.jpg',
            subcategory: 'LANDING',
          },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should upload new image when file is present', async () => {
        resolveImageUrl.mockResolvedValue('https://cloudinary.com/nuevo.jpg');
        mockPrisma.designProject.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          imageUrl: 'https://cloudinary.com/nuevo.jpg',
          subcategory: 'LOGO',
        });
        req.params = { id: '1' };
        req.file = { originalname: 'n.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x') };
        req.body = { title: 'Actualizada' };

        await update(req, res);

        expect(resolveImageUrl).toHaveBeenCalledWith(req.file, undefined, 'diseno');
        expect(mockPrisma.designProject.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Actualizada', imageUrl: 'https://cloudinary.com/nuevo.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should persist the public id when updating with a Cloudinary URL', async () => {
        extractPublicId.mockReturnValue('portfolio/new');
        mockPrisma.designProject.update.mockResolvedValue({ id: 1, imageUrl: 'https://res.cloudinary.com/demo/new.jpg' });
        req.params = { id: '1' };
        req.body = { imageUrl: 'https://res.cloudinary.com/demo/new.jpg' };

        await update(req, res);

        expect(mockPrisma.designProject.update).toHaveBeenCalledWith({
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
        expect(mockPrisma.designProject.update).not.toHaveBeenCalled();
        expect(deleteCloudinaryImage).not.toHaveBeenCalled();
      });
    });

    it('should delete the previous image when updating the image', async () => {
      mockPrisma.designProject.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/old.jpg',
        imagePublicId: 'portfolio/old',
      });
      mockPrisma.designProject.update.mockResolvedValue({ id: 1, imageUrl: 'https://example.com/new.jpg' });
      req.params = { id: '1' };
      req.body = { imageUrl: 'https://example.com/new.jpg' };

      await update(req, res);

      expect(deleteCloudinaryImage).toHaveBeenCalledWith('portfolio/old', expect.any(String));
    });

    describe('given isPublished and isFeatured', () => {
      it('should persist isPublished and isFeatured', async () => {
        mockPrisma.designProject.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          isPublished: true,
          isFeatured: false,
        });
        req.params = { id: '1' };
        req.body = { isPublished: true, isFeatured: false };

        await update(req, res);

        expect(mockPrisma.designProject.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { isPublished: true, isFeatured: false },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('given project does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record not found');
        error.code = 'P2025';
        mockPrisma.designProject.update.mockRejectedValue(error);
        req.params = { id: '999' };
        req.body = { title: 'Test' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Proyecto de diseño no encontrado',
          code: 'NOT_FOUND',
        });
      });

      it('should return 404 when the project lookup returns null', async () => {
        mockPrisma.designProject.findUnique.mockResolvedValue(null);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.designProject.update.mockRejectedValue(dupError);
        req.params = { id: '1' };
        req.body = { title: 'Proyecto' };

        await update(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe un proyecto de diseño con ese título',
          code: 'DUPLICATE_ERROR',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.update.mockRejectedValue(new Error('DB Error'));
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
    describe('given existing project', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.designProject.findUnique.mockResolvedValue(undefined);
        mockPrisma.designProject.delete.mockResolvedValue({ id: 1 });
        req.params = { id: '1' };

        await remove(req, res);

        expect(mockPrisma.designProject.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Proyecto de diseño eliminado correctamente' },
        });
        expect(logger.info).toHaveBeenCalled();
      });
    });

    it('should delete the Cloudinary image before the design project', async () => {
      mockPrisma.designProject.findUnique.mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/obra.jpg',
        imagePublicId: 'portfolio/obra',
      });
      mockPrisma.designProject.delete.mockResolvedValue({ id: 1 });
      req.params = { id: '1' };

      await remove(req, res);

      expect(deleteCloudinaryImage).toHaveBeenCalledWith('portfolio/obra', expect.any(String));
      expect(mockPrisma.designProject.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    describe('given project does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to delete does not exist');
        error.code = 'P2025';
        mockPrisma.designProject.delete.mockRejectedValue(error);
        req.params = { id: '999' };

        await remove(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Proyecto de diseño no encontrado',
          code: 'NOT_FOUND',
        });
      });
    });

    describe('given a database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.delete.mockRejectedValue(new Error('DB Error'));
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
        mockPrisma.designProject.update.mockResolvedValue({ id: 2, position: 0 });
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
        mockPrisma.designProject.update.mockRejectedValue(notFoundError);
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
        mockPrisma.designProject.update.mockRejectedValue(new Error('DB Error'));
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

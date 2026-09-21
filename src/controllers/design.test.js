/**
 * @fileoverview Tests unitarios del controller de proyectos de diseño.
 *
 * Cubre HU09 - Admin Diseño: create, update, remove.
 *
 * @module controllers/design.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/upload.js', () => ({
  resolveImageUrl: vi.fn(),
  ALLOWED_SECTIONS: ['pintura', 'ilustracion', 'diseno', 'general'],
}));

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { create, update, remove, listFiltered, listFeatured } = await import('./design.js');
const { resolveImageUrl } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;

describe('HU09 - Admin Diseño', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, file: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
    resolveImageUrl.mockImplementation(async (_file, imageUrl) => imageUrl);
  });

  describe('listFiltered', () => {
    describe('given no subcategory', () => {
      it('should return 200 with all projects', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([
          { id: 1, title: 'Proyecto A', subcategory: 'imagen-corporativa' },
          { id: 2, title: 'Proyecto B', subcategory: 'editorial' },
        ]);
        req.query = {};

        await listFiltered(req, res);

        expect(mockPrisma.designProject.findMany).toHaveBeenCalledWith({
          where: { isPublished: true },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            { id: 1, title: 'Proyecto A', subcategory: 'imagen-corporativa' },
            { id: 2, title: 'Proyecto B', subcategory: 'editorial' },
          ],
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
        req.query = {};

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
});

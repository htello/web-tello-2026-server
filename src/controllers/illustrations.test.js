/**
 * @fileoverview Tests unitarios del controller de ilustraciones.
 *
 * Cubre HU08 - Admin Ilustraciones: create, update, remove.
 *
 * @module controllers/illustrations.test
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

const { create, update, remove } = await import('./illustrations.js');
const { resolveImageUrl } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;

describe('HU08 - Admin Ilustraciones', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, file: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
    resolveImageUrl.mockImplementation(async (_file, imageUrl) => imageUrl);
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
});

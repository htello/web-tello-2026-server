/**
 * @fileoverview Tests unitarios del controller de biografía.
 *
 * Cubre HU12 - Admin Biografía: get, create y update (con y sin imageUrl).
 *
 * @module controllers/biography.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/upload.js', () => ({
  resolveImageUrl: vi.fn(),
  resolveImageAsset: vi.fn(),
}));

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../services/cloudinary.js', () => ({
  deleteCloudinaryImage: vi.fn(),
  extractPublicId: vi.fn(() => null),
}));

const { get, create, update } = await import('./biography.js');
const { resolveImageUrl, resolveImageAsset } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;
const { deleteCloudinaryImage, extractPublicId } = await import('../services/cloudinary.js');

describe('HU12 - Admin Biografía', () => {
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

  describe('get', () => {
    it('should return 200 with biography', async () => {
      mockPrisma.biography.findFirst.mockResolvedValue({
        id: 1,
        content: 'Mi biografía',
        imageUrl: 'https://example.com/portrait.jpg',
      });

      await get(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 1, content: 'Mi biografía', imageUrl: 'https://example.com/portrait.jpg' },
      });
    });

    it('should return 404 when biography does not exist', async () => {
      mockPrisma.biography.findFirst.mockResolvedValue(null);

      await get(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Biografía no encontrada',
        code: 'NOT_FOUND',
      });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.biography.findFirst.mockRejectedValue(new Error('DB Error'));

      await get(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    describe('when biography does not exist', () => {
      it('should return 201 and persist imageUrl', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({
          id: 1,
          content: 'Nueva',
          imageUrl: 'https://example.com/portrait.jpg',
        });
        req.body = { content: 'Nueva', imageUrl: 'https://example.com/portrait.jpg' };

        await create(req, res);

        expect(mockPrisma.biography.create).toHaveBeenCalledWith({
          data: { content: 'Nueva', imageUrl: 'https://example.com/portrait.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should create with null imageUrl when not provided', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({
          id: 1,
          content: 'Nueva',
          imageUrl: null,
        });
        req.body = { content: 'Nueva' };

        await create(req, res);

        expect(mockPrisma.biography.create).toHaveBeenCalledWith({
          data: { content: 'Nueva', imageUrl: null },
        });
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('when biography already exists', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        req.body = { content: 'Nueva' };

        await create(req, res);

        expect(mockPrisma.biography.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Ya existe una biografía',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.biography.findFirst.mockRejectedValue(new Error('DB Error'));
      req.body = { content: 'Contenido de prueba' };

      await create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    describe('when biography exists', () => {
      it('should update content and persist imageUrl', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Actualizada',
          imageUrl: 'https://example.com/new.jpg',
        });
        req.body = { content: 'Actualizada', imageUrl: 'https://example.com/new.jpg' };

        await update(req, res);

        expect(mockPrisma.biography.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { content: 'Actualizada', imageUrl: 'https://example.com/new.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
      });

      it('should update only the image and preserve the existing content', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({
          id: 1,
          content: 'Contenido existente de la biografía',
          imageUrl: 'https://example.com/old.jpg',
          imagePublicId: null,
        });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Contenido existente de la biografía',
          imageUrl: 'https://example.com/new.jpg',
        });
        req.body = { imageUrl: 'https://example.com/new.jpg' };

        await update(req, res);

        expect(mockPrisma.biography.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { imageUrl: 'https://example.com/new.jpg' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should persist the public id when the replacement image is Cloudinary-hosted', async () => {
        extractPublicId.mockReturnValue('portfolio/new');
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1, imageUrl: null, imagePublicId: null });
        mockPrisma.biography.update.mockResolvedValue({ id: 1, content: 'Nueva' });
        req.body = { content: 'Nueva', imageUrl: 'https://res.cloudinary.com/demo/new.jpg' };

        await update(req, res);

        expect(mockPrisma.biography.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { content: 'Nueva', imageUrl: 'https://res.cloudinary.com/demo/new.jpg', imagePublicId: 'portfolio/new' },
        });
      });

      it('should persist the public id when creating a Cloudinary biography image', async () => {
        extractPublicId.mockReturnValue('portfolio/biography');
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({ id: 1, content: 'Nueva' });
        req.body = { content: 'Nueva', imageUrl: 'https://res.cloudinary.com/demo/bio.jpg' };

        await create(req, res);

        expect(mockPrisma.biography.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ imagePublicId: 'portfolio/biography' }),
        });
      });

      it('should persist the public id returned by the upload asset', async () => {
        resolveImageAsset.mockResolvedValue({
          url: 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/biography.jpg',
          publicId: 'portfolio/biography-real-id',
        });
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({ id: 1, content: 'Nueva' });
        req.file = { buffer: Buffer.from('image') };
        req.body = { content: 'Nueva' };

        await create(req, res);

        expect(mockPrisma.biography.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ imagePublicId: 'portfolio/biography-real-id' }),
        });
      });

      it('should update content only when no image provided', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Actualizada',
          imageUrl: 'https://example.com/old.jpg',
        });
        req.body = { content: 'Actualizada' };

        await update(req, res);

        expect(mockPrisma.biography.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { content: 'Actualizada' },
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should delete the previous biography image when replacing it', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({
          id: 1,
          imageUrl: 'https://res.cloudinary.com/demo/old.jpg',
          imagePublicId: 'portfolio/old',
        });
        mockPrisma.biography.update.mockResolvedValue({ id: 1, content: 'Nueva' });
        req.body = { content: 'Nueva', imageUrl: 'https://example.com/new.jpg' };

        await update(req, res);

        expect(deleteCloudinaryImage).toHaveBeenCalledWith(
          'portfolio/old',
          'https://res.cloudinary.com/demo/old.jpg',
        );
      });
    });

    describe('when biography does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        req.body = { content: 'Actualizada' };

        await update(req, res);

        expect(mockPrisma.biography.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Biografía no encontrada',
          code: 'NOT_FOUND',
        });
      });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.biography.findFirst.mockRejectedValue(new Error('DB Error'));
      req.body = { content: 'Contenido de prueba' };

      await update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return 500 when update fails', async () => {
      mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.biography.update.mockRejectedValue(new Error('DB Error'));
      req.body = { content: 'Contenido de prueba' };

      await update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});

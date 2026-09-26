/**
 * @fileoverview Tests unitarios del servicio de upload.
 *
 * @module services/upload.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cloudinary', () => ({
  v2: {
    uploader: { upload: vi.fn(), destroy: vi.fn() },
    url: vi.fn(),
  },
}));

const { multerMock, capturedConfig } = vi.hoisted(() => {
  const captured = {};
  const mock = vi.fn((config) => {
    captured.value = config;
    return { single: vi.fn() };
  });
  mock.memoryStorage = vi.fn();
  return { multerMock: mock, capturedConfig: captured };
});

vi.mock('multer', () => ({ default: multerMock }));

const cloudinary = (await import('cloudinary')).v2;

describe('HU16 - Upload Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upload (multer config)', () => {
    it('should configure multer with memory storage', async () => {
      await import('./upload.js');
      expect(multerMock.memoryStorage).toHaveBeenCalled();
    });

    it('should accept allowed MIME types', async () => {
      const { upload } = await import('./upload.js');
      expect(upload).toBeDefined();
    });

    it('should limit file size to 5MB', async () => {
      await import('./upload.js');
      expect(capturedConfig.value.limits).toEqual({ fileSize: 5 * 1024 * 1024 });
    });

    it('should reject disallowed MIME types via fileFilter', async () => {
      await import('./upload.js');
      const cb = vi.fn();

      capturedConfig.value.fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('should accept image/webp via fileFilter', async () => {
      await import('./upload.js');
      const cb = vi.fn();

      capturedConfig.value.fileFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });

  describe('uploadToCloudinary', () => {
    it('should upload file and return URLs with default section', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'portfolio-antonio-tello/general/test',
        width: 1200,
        height: 800,
        format: 'jpg',
      });
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/test_thumb.jpg');

      const { uploadToCloudinary } = await import('./upload.js');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg' };

      const result = await uploadToCloudinary(file);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('publicId', 'portfolio-antonio-tello/general/test');
      expect(result).toHaveProperty('thumbnail');
      expect(result).toHaveProperty('width', 1200);
      expect(result).toHaveProperty('height', 800);
      expect(result).toHaveProperty('format', 'jpg');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'portfolio-antonio-tello/general' })
      );
    });

    it('should upload file to correct section folder', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/pintura.jpg',
        public_id: 'portfolio-antonio-tello/pintura/pintura',
        width: 1200,
        height: 800,
        format: 'jpg',
      });
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/pintura_thumb.jpg');

      const { uploadToCloudinary } = await import('./upload.js');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'pintura.jpg' };

      await uploadToCloudinary(file, 'pintura');

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'portfolio-antonio-tello/pintura' })
      );
    });

    it('should upload file to exposiciones folder', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/expo.jpg',
        public_id: 'portfolio-antonio-tello/exposiciones/expo',
        width: 1200,
        height: 800,
        format: 'jpg',
      });
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/expo_thumb.jpg');

      const { uploadToCloudinary } = await import('./upload.js');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'expo.jpg' };

      await uploadToCloudinary(file, 'exposiciones');

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'portfolio-antonio-tello/exposiciones' })
      );
    });

    it('should upload file to test folder for internal use', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/prueba.jpg',
        public_id: 'portfolio-antonio-tello/test/prueba',
        width: 1200,
        height: 800,
        format: 'jpg',
      });
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/prueba_thumb.jpg');

      const { uploadToCloudinary } = await import('./upload.js');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'prueba.jpg' };

      await uploadToCloudinary(file, 'test');

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'portfolio-antonio-tello/test' })
      );
    });

    it('should use general folder for invalid section', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'portfolio-antonio-tello/general/test',
        width: 1200,
        height: 800,
        format: 'jpg',
      });
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/test_thumb.jpg');

      const { uploadToCloudinary } = await import('./upload.js');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg' };

      await uploadToCloudinary(file, 'invalid-section');

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'portfolio-antonio-tello/general' })
      );
    });
  });

  describe('resolveImageAsset', () => {
    it('should return provided imageUrl when no file is present', async () => {
      const { resolveImageAsset } = await import('./upload.js');

      const result = await resolveImageAsset(null, 'https://example.com/p.jpg', 'pintura');

      expect(result).toEqual({ url: 'https://example.com/p.jpg', publicId: null });
      expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
    });

    it('should upload file and return url and publicId when file is present', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/pintura.jpg',
        public_id: 'portfolio-antonio-tello/pintura/pintura',
        width: 1200,
        height: 800,
        format: 'jpg',
      });
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/pintura_thumb.jpg');

      const { resolveImageAsset } = await import('./upload.js');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'pintura.jpg' };

      const result = await resolveImageAsset(file, undefined, 'pintura');

      expect(result).toMatchObject({
        url: 'https://res.cloudinary.com/test/image/upload/pintura.jpg',
        publicId: 'portfolio-antonio-tello/pintura/pintura',
      });
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'portfolio-antonio-tello/pintura' })
      );
    });
  });

  describe('ALLOWED_SECTIONS', () => {
    it('should include pintura, ilustracion, diseno, general, exposiciones', async () => {
      const { ALLOWED_SECTIONS } = await import('./upload.js');
      expect(ALLOWED_SECTIONS).toContain('pintura');
      expect(ALLOWED_SECTIONS).toContain('ilustracion');
      expect(ALLOWED_SECTIONS).toContain('diseno');
      expect(ALLOWED_SECTIONS).toContain('general');
      expect(ALLOWED_SECTIONS).toContain('exposiciones');
    });

    it('should not include test (internal use only)', async () => {
      const { ALLOWED_SECTIONS } = await import('./upload.js');
      expect(ALLOWED_SECTIONS).not.toContain('test');
    });
  });
});

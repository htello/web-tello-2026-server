import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile } from './upload.js';

vi.mock('../services/upload.js', () => ({
  uploadToCloudinary: vi.fn(),
  ALLOWED_SECTIONS: ['pintura', 'ilustracion', 'diseno', 'general'],
}));

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { uploadToCloudinary } = await import('../services/upload.js');
const logger = (await import('../services/logger.js')).default;

describe('HU16 - Upload Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { file: null, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('given valid file', () => {
    it('should return 200 with upload data and default section', async () => {
      req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
      uploadToCloudinary.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/test.jpg',
        thumbnail: 'https://res.cloudinary.com/test/test_thumb.jpg',
        width: 1200,
        height: 800,
        format: 'jpg',
      });

      await uploadFile(req, res);

      expect(uploadToCloudinary).toHaveBeenCalledWith(req.file, 'general');
      expect(res.json).toHaveBeenCalledWith({
        data: {
          url: 'https://res.cloudinary.com/test/test.jpg',
          thumbnail: 'https://res.cloudinary.com/test/test_thumb.jpg',
          width: 1200,
          height: 800,
          format: 'jpg',
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return 200 with correct section', async () => {
      req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
      req.body.section = 'pintura';
      uploadToCloudinary.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/pintura.jpg',
        thumbnail: 'https://res.cloudinary.com/test/pintura_thumb.jpg',
        width: 1200,
        height: 800,
        format: 'jpg',
      });

      await uploadFile(req, res);

      expect(uploadToCloudinary).toHaveBeenCalledWith(req.file, 'pintura');
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('given no file', () => {
    it('should return 400', async () => {
      req.file = null;

      await uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se proporcionó archivo',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('given invalid section', () => {
    it('should return 400', async () => {
      req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
      req.body.section = 'invalid-section';

      await uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Sección no válida. Permitidas: pintura, ilustracion, diseno, general',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('given cloudinary error', () => {
    it('should return 500', async () => {
      req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
      uploadToCloudinary.mockRejectedValue(new Error('Cloudinary failed'));

      await uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

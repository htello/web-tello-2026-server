import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile } from './upload.js';

vi.mock('../services/upload.js', () => ({
  uploadToCloudinary: vi.fn(),
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
    req = { file: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('given valid file', () => {
    it('should return 200 with upload data', async () => {
      req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
      uploadToCloudinary.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/test.jpg',
        thumbnail: 'https://res.cloudinary.com/test/test_thumb.jpg',
        width: 1200,
        height: 800,
        format: 'jpg',
      });

      await uploadFile(req, res);

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

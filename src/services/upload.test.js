import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cloudinary', () => ({
  v2: {
    uploader: { upload: vi.fn() },
    url: vi.fn(),
  },
}));

vi.mock('multer', () => {
  const multer = vi.fn(() => ({
    single: vi.fn(),
  }));
  multer.memoryStorage = vi.fn();
  return { default: multer };
});

const cloudinary = (await import('cloudinary')).v2;
const multer = (await import('multer')).default;

describe('HU16 - Upload Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upload (multer config)', () => {
    it('should configure multer with memory storage', async () => {
      await import('./upload.js');
      expect(multer.memoryStorage).toHaveBeenCalled();
    });

    it('should accept allowed MIME types', async () => {
      const { upload } = await import('./upload.js');
      expect(upload).toBeDefined();
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

  describe('ALLOWED_TYPES', () => {
    it('should include image/jpeg, image/png, image/webp', async () => {
      const { ALLOWED_TYPES } = await import('./upload.js');
      expect(ALLOWED_TYPES).toContain('image/jpeg');
      expect(ALLOWED_TYPES).toContain('image/png');
      expect(ALLOWED_TYPES).toContain('image/webp');
    });
  });

  describe('MAX_SIZE', () => {
    it('should be 5MB', async () => {
      const { MAX_SIZE } = await import('./upload.js');
      expect(MAX_SIZE).toBe(5 * 1024 * 1024);
    });
  });

  describe('ALLOWED_SECTIONS', () => {
    it('should include pintura, ilustracion, diseno, general', async () => {
      const { ALLOWED_SECTIONS } = await import('./upload.js');
      expect(ALLOWED_SECTIONS).toContain('pintura');
      expect(ALLOWED_SECTIONS).toContain('ilustracion');
      expect(ALLOWED_SECTIONS).toContain('diseno');
      expect(ALLOWED_SECTIONS).toContain('general');
    });
  });

  describe('fileFilter', () => {
    it('should accept allowed MIME types', async () => {
      const { fileFilter } = await import('./upload.js');
      const cb = vi.fn();

      fileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);

      cb.mockClear();
      fileFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);

      cb.mockClear();
      fileFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject disallowed MIME types', async () => {
      const { fileFilter } = await import('./upload.js');
      const cb = vi.fn();

      fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});

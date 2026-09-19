import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

const mockUploadFile = vi.fn((req, res, next) => next());

vi.mock('../../src/services/upload.js', () => ({
  upload: {
    single: () => mockUploadFile,
  },
  uploadToCloudinary: vi.fn(),
  ALLOWED_SECTIONS: ['pintura', 'ilustracion', 'diseno', 'general'],
}));

const app = (await import('../../src/app.js')).default;
const { uploadToCloudinary } = await import('../../src/services/upload.js');

describe('HU16 - Upload de Archivos', () => {
  let adminToken;

  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    uploadToCloudinary.mockReset();
    mockUploadFile.mockReset();
    mockUploadFile.mockImplementation((req, res, next) => next());
    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  describe('given valid image file and admin token', () => {
    it('should return 200 with upload URLs', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'admin@test.com', role: 'ADMIN',
      });

      mockUploadFile.mockImplementation((req, res, next) => {
        req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
        next();
      });

      uploadToCloudinary.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        thumbnail: 'https://res.cloudinary.com/test/image/upload/test_thumb.jpg',
        width: 1200,
        height: 800,
        format: 'jpg',
      });

      const res = await request(app)
        .post('/api/v1/admin/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'multipart/form-data')
        .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data).toHaveProperty('thumbnail');
      expect(res.body.data).toHaveProperty('width', 1200);
      expect(res.body.data).toHaveProperty('height', 800);
      expect(res.body.data).toHaveProperty('format', 'jpg');
    });
  });

  describe('given no file provided', () => {
    it('should return 400', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'admin@test.com', role: 'ADMIN',
      });

      mockUploadFile.mockImplementation((req, res, _next) => {
        res.status(400).json({ error: 'No se proporcionó archivo', code: 'VALIDATION_ERROR' });
      });

      const res = await request(app)
        .post('/api/v1/admin/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('given no auth token', () => {
    it('should return 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/upload')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('given invalid token', () => {
    it('should return 403', async () => {
      const badToken = jwt.sign({ id: 1, role: 'ADMIN' }, 'wrong-secret');
      const res = await request(app)
        .post('/api/v1/admin/upload')
        .set('Authorization', `Bearer ${badToken}`)
        .set('Content-Type', 'multipart/form-data')
        .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(403);
    });
  });

  describe('given non-admin user', () => {
    it('should return 403', async () => {
      const userToken = jwt.sign({ id: 2, email: 'user@test.com', role: 'USER' }, JWT_SECRET, { expiresIn: '24h' });
      const res = await request(app)
        .post('/api/v1/admin/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(403);
    });
  });

  describe('given cloudinary fails', () => {
    it('should return 500', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'admin@test.com', role: 'ADMIN',
      });

      mockUploadFile.mockImplementation((req, res, next) => {
        req.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'test.jpg', size: 1024 };
        next();
      });

      uploadToCloudinary.mockRejectedValue(new Error('Cloudinary error'));

      const res = await request(app)
        .post('/api/v1/admin/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'multipart/form-data')
        .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(500);
    });
  });
});

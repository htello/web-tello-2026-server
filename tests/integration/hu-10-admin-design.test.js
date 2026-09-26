import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

vi.mock('../../src/services/upload.js', async (importOriginal) => {
  const original = await importOriginal();
  const uploadToCloudinary = vi.fn();
  return {
    ...original,
    uploadToCloudinary,
    resolveImageUrl: vi.fn(async (file, imageUrl, section) => {
      if (!file) return imageUrl;
      const result = await uploadToCloudinary(file, section);
      return result.url;
    }),
    resolveImageAsset: vi.fn(async (file, imageUrl, section) => {
      if (!file) return { url: imageUrl, publicId: null };
      const result = await uploadToCloudinary(file, section);
      return { url: result.url, publicId: result.publicId };
    }),
  };
});

const app = (await import('../../src/app.js')).default;
const { uploadToCloudinary } = await import('../../src/services/upload.js');

describe('HU10 - Admin Design', () => {
  let adminToken;

  beforeEach(() => {
    vi.clearAllMocks();
    uploadToCloudinary.mockReset();
    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  describe('GET /admin/design', () => {
    describe('given admin token', () => {
      it('should return 200 with all projects including unpublished', async () => {
        mockPrisma.designProject.findMany.mockResolvedValue([
          { id: 1, title: 'Publicado', subcategory: 'editorial', isPublished: true },
          { id: 2, title: 'Borrador', subcategory: 'editorial', isPublished: false },
        ]);
        mockPrisma.designProject.count.mockResolvedValue(2);

        const res = await request(app)
          .get('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[1]).toMatchObject({ id: 2, isPublished: false });
        expect(res.body.meta).toEqual({ total: 2, page: 1, limit: 20, pages: 1 });
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app).get('/api/v1/admin/design');

        expect(res.status).toBe(401);
      });
    });
  });

  describe('GET /admin/illustrations', () => {
    describe('given admin token', () => {
      it('should return 200 with all illustrations including unpublished', async () => {
        mockPrisma.illustration.findMany.mockResolvedValue([
          { id: 1, title: 'Publicada', imageUrl: 'https://example.com/1.jpg', isPublished: true },
          { id: 2, title: 'Borrador', imageUrl: 'https://example.com/2.jpg', isPublished: false },
        ]);
        mockPrisma.illustration.count.mockResolvedValue(2);

        const res = await request(app)
          .get('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[1]).toMatchObject({ id: 2, isPublished: false });
        expect(res.body.meta).toEqual({ total: 2, page: 1, limit: 20, pages: 1 });
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app).get('/api/v1/admin/illustrations');

        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /admin/design', () => {
    describe('given admin token and valid data', () => {
      it('should return 201 with created project', async () => {
        mockPrisma.designProject.create.mockResolvedValue({
          id: 1,
          title: 'Nuevo Diseño',
          description: 'Descripcion',
          imageUrl: 'https://res.cloudinary.com/test/design.jpg',
          subcategory: 'imagen-corporativa',
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Nuevo Diseño',
            imageUrl: 'https://res.cloudinary.com/test/design.jpg',
            subcategory: 'imagen-corporativa',
            description: 'Descripcion',
          });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('title', 'Nuevo Diseño');
      });
    });

    describe('given multipart file upload', () => {
      it('should upload to Cloudinary and create project', async () => {
        uploadToCloudinary.mockResolvedValue({
          url: 'https://res.cloudinary.com/test/uploaded.jpg',
          thumbnail: 'https://res.cloudinary.com/test/uploaded_thumb.jpg',
          width: 1200,
          height: 800,
          format: 'jpg',
        });

        mockPrisma.designProject.create.mockResolvedValue({
          id: 1,
          title: 'Diseño Upload',
          imageUrl: 'https://res.cloudinary.com/test/uploaded.jpg',
          subcategory: 'carteleria',
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Diseño Upload')
          .field('subcategory', 'carteleria')
          .attach('image', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(201);
        expect(uploadToCloudinary).toHaveBeenCalled();
        expect(res.body.data).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/uploaded.jpg');
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .post('/api/v1/admin/design')
          .send({ title: 'Test', imageUrl: 'https://test.com/img.jpg', subcategory: 'imagen-corporativa' });

        expect(res.status).toBe(401);
      });
    });

    describe('given missing title', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ imageUrl: 'https://test.com/img.jpg', subcategory: 'imagen-corporativa' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given invalid subcategory', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test', imageUrl: 'https://test.com/img.jpg', subcategory: 'invalid' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given no image', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test', subcategory: 'imagen-corporativa' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given duplicate title', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.designProject.create.mockRejectedValue(dupError);

        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Existente',
            imageUrl: 'https://test.com/img.jpg',
            subcategory: 'imagen-corporativa',
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/design')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test',
            imageUrl: 'https://test.com/img.jpg',
            subcategory: 'imagen-corporativa',
          });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/design/:id', () => {
    describe('given admin token and valid data', () => {
      it('should return 200 with updated project', async () => {
        mockPrisma.designProject.update.mockResolvedValue({
          id: 1,
          title: 'Actualizado',
          imageUrl: 'https://test.com/img.jpg',
          subcategory: 'sub',
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/design/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Actualizado' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('title', 'Actualizado');
      });
    });

    describe('given multipart file upload on update', () => {
      it('should upload to Cloudinary and update project', async () => {
        uploadToCloudinary.mockResolvedValue({
          url: 'https://res.cloudinary.com/test/uploaded_new.jpg',
          thumbnail: 'https://res.cloudinary.com/test/uploaded_new_thumb.jpg',
          width: 1200,
          height: 800,
          format: 'jpg',
        });

        mockPrisma.designProject.update.mockResolvedValue({
          id: 1,
          title: 'Test',
          imageUrl: 'https://res.cloudinary.com/test/uploaded_new.jpg',
          subcategory: 'sub',
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/design/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Test')
          .attach('image', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(200);
        expect(uploadToCloudinary).toHaveBeenCalled();
      });
    });

    describe('given project does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to update not found');
        error.code = 'P2025';
        mockPrisma.designProject.update.mockRejectedValue(error);

        const res = await request(app)
          .put('/api/v1/admin/design/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.designProject.update.mockRejectedValue(dupError);

        const res = await request(app)
          .put('/api/v1/admin/design/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Duplicado' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/design/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('DELETE /admin/design/:id', () => {
    describe('given admin token and existing project', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.designProject.findUnique.mockResolvedValue({
          id: 1,
          imageUrl: null,
          imagePublicId: null,
        });
        mockPrisma.designProject.delete.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .delete('/api/v1/admin/design/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given project does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const error = new Error('Record to delete does not exist');
        error.code = 'P2025';
        mockPrisma.designProject.delete.mockRejectedValue(error);

        const res = await request(app)
          .delete('/api/v1/admin/design/999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.findUnique.mockResolvedValue({
          id: 1,
          imageUrl: null,
          imagePublicId: null,
        });
        mockPrisma.designProject.delete.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .delete('/api/v1/admin/design/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  // ─── ILLUSTRATIONS ─────────────────────────────────────────

  describe('POST /admin/illustrations', () => {
    describe('given admin token and valid data', () => {
      it('should return 201 with created illustration', async () => {
        mockPrisma.illustration.create.mockResolvedValue({
          id: 1,
          title: 'Nueva Ilustración',
          description: 'Descripcion',
          imageUrl: 'https://res.cloudinary.com/test/ill.jpg',
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Nueva Ilustración',
            imageUrl: 'https://res.cloudinary.com/test/ill.jpg',
            description: 'Descripcion',
          });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('title', 'Nueva Ilustración');
      });
    });

    describe('given multipart file upload', () => {
      it('should upload to Cloudinary and create illustration', async () => {
        uploadToCloudinary.mockResolvedValue({
          url: 'https://res.cloudinary.com/test/uploaded.jpg',
          thumbnail: 'https://res.cloudinary.com/test/uploaded_thumb.jpg',
          width: 1200,
          height: 800,
          format: 'jpg',
        });

        mockPrisma.illustration.create.mockResolvedValue({
          id: 1,
          title: 'Ilustración Upload',
          imageUrl: 'https://res.cloudinary.com/test/uploaded.jpg',
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Ilustración Upload')
          .attach('image', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(201);
        expect(uploadToCloudinary).toHaveBeenCalled();
        expect(res.body.data).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/uploaded.jpg');
      });
    });

    describe('given missing title', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ imageUrl: 'https://test.com/img.jpg' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given no image', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given duplicate title', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.illustration.create.mockRejectedValue(dupError);

        const res = await request(app)
          .post('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Existente', imageUrl: 'https://test.com/img.jpg' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/illustrations')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test', imageUrl: 'https://test.com/img.jpg' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/illustrations/:id', () => {
    describe('given admin token and valid data', () => {
      it('should return 200 with updated illustration', async () => {
        mockPrisma.illustration.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          imageUrl: 'https://test.com/img.jpg',
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/illustrations/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Actualizada' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('title', 'Actualizada');
      });
    });

    describe('given multipart file upload on update', () => {
      it('should upload to Cloudinary and update illustration', async () => {
        uploadToCloudinary.mockResolvedValue({
          url: 'https://res.cloudinary.com/test/uploaded_new.jpg',
          thumbnail: 'https://res.cloudinary.com/test/uploaded_new_thumb.jpg',
          width: 1200,
          height: 800,
          format: 'jpg',
        });

        mockPrisma.illustration.update.mockResolvedValue({
          id: 1,
          title: 'Test',
          imageUrl: 'https://res.cloudinary.com/test/uploaded_new.jpg',
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/illustrations/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Test')
          .attach('image', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(200);
        expect(uploadToCloudinary).toHaveBeenCalled();
      });
    });

    describe('given illustration does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.illustration.update.mockRejectedValue(notFoundError);

        const res = await request(app)
          .put('/api/v1/admin/illustrations/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        const dupError = new Error('Unique constraint failed');
        dupError.code = 'P2002';
        mockPrisma.illustration.update.mockRejectedValue(dupError);

        const res = await request(app)
          .put('/api/v1/admin/illustrations/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Duplicada' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/illustrations/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('DELETE /admin/illustrations/:id', () => {
    describe('given admin token and existing illustration', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.illustration.findUnique.mockResolvedValue({
          id: 1,
          imageUrl: null,
          imagePublicId: null,
        });
        mockPrisma.illustration.delete.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .delete('/api/v1/admin/illustrations/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given illustration does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to delete does not exist');
        notFoundError.code = 'P2025';
        mockPrisma.illustration.delete.mockRejectedValue(notFoundError);

        const res = await request(app)
          .delete('/api/v1/admin/illustrations/999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.findUnique.mockResolvedValue({
          id: 1,
          imageUrl: null,
          imagePublicId: null,
        });
        mockPrisma.illustration.delete.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .delete('/api/v1/admin/illustrations/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/design/reorder', () => {
    describe('given admin token and orderedIds', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.designProject.update.mockResolvedValue({ position: 0 });

        const res = await request(app)
          .put('/api/v1/admin/design/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [2, 1] });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .put('/api/v1/admin/design/reorder')
          .send({ orderedIds: [1, 2] });

        expect(res.status).toBe(401);
      });
    });

    describe('given a non-existent id', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.designProject.update.mockRejectedValue(notFoundError);

        const res = await request(app)
          .put('/api/v1/admin/design/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [999] });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error during reorder', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.designProject.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/design/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [1, 2] });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/illustrations/reorder', () => {
    describe('given admin token and orderedIds', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.illustration.update.mockResolvedValue({ position: 0 });

        const res = await request(app)
          .put('/api/v1/admin/illustrations/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [2, 1] });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .put('/api/v1/admin/illustrations/reorder')
          .send({ orderedIds: [1, 2] });

        expect(res.status).toBe(401);
      });
    });

    describe('given a non-existent id', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.illustration.update.mockRejectedValue(notFoundError);

        const res = await request(app)
          .put('/api/v1/admin/illustrations/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [999] });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error during reorder', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.illustration.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/illustrations/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [1, 2] });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

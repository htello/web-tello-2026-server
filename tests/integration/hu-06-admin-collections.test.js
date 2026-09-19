import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

vi.mock('../../src/services/upload.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    uploadToCloudinary: vi.fn(),
  };
});

const app = (await import('../../src/app.js')).default;
const { uploadToCloudinary } = await import('../../src/services/upload.js');

describe('HU06 - Admin Colecciones y Pinturas', () => {
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

  // ─── COLLECTIONS ────────────────────────────────────────────

  describe('POST /admin/collections', () => {
    describe('given admin token and valid title', () => {
      it('should return 201 with created collection', async () => {
        mockPrisma.collection.create.mockResolvedValue({
          id: 1,
          title: 'Mi Colección',
          description: null,
          coverImage: null,
          position: 0,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/collections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Mi Colección' });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('title', 'Mi Colección');
        expect(res.body.data).toHaveProperty('isPublished', false);
        expect(res.body.data).toHaveProperty('position', 0);
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .post('/api/v1/admin/collections')
          .send({ title: 'Test' });

        expect(res.status).toBe(401);
      });
    });

    describe('given invalid token', () => {
      it('should return 403', async () => {
        const badToken = jwt.sign({ id: 1, role: 'ADMIN' }, 'wrong-secret');
        const res = await request(app)
          .post('/api/v1/admin/collections')
          .set('Authorization', `Bearer ${badToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(403);
      });
    });

    describe('given missing title', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/collections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/collections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });

    describe('given duplicate title', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        mockPrisma.collection.create.mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`title`)')
        );

        const res = await request(app)
          .post('/api/v1/admin/collections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Óleos' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });
  });

  describe('PUT /admin/collections/:id', () => {
    describe('given admin token and valid data', () => {
      it('should return 200 with updated collection', async () => {
        mockPrisma.collection.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo Título',
          description: null,
          coverImage: null,
          position: 0,
          isPublished: false,
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/collections/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Nuevo Título' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('title', 'Nuevo Título');
      });
    });

    describe('given admin token with description and coverImage', () => {
      it('should update all fields', async () => {
        mockPrisma.collection.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          description: 'Nueva descripción',
          coverImage: 'https://res.cloudinary.com/test/cover.jpg',
          position: 0,
          isPublished: false,
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/collections/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Actualizada',
            description: 'Nueva descripción',
            coverImage: 'https://res.cloudinary.com/test/cover.jpg',
          });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('description', 'Nueva descripción');
        expect(res.body.data).toHaveProperty('coverImage', 'https://res.cloudinary.com/test/cover.jpg');
      });
    });

    describe('given collection does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.collection.update.mockRejectedValue(
          new Error('Record to update not found')
        );

        const res = await request(app)
          .put('/api/v1/admin/collections/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/collections/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        mockPrisma.collection.update.mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`title`)')
        );

        const res = await request(app)
          .put('/api/v1/admin/collections/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Esculturas' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });
  });

  describe('DELETE /admin/collections/:id', () => {
    describe('given admin token and existing collection', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.collection.delete.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .delete('/api/v1/admin/collections/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given collection does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.collection.delete.mockRejectedValue(
          new Error('Record to delete does not exist')
        );

        const res = await request(app)
          .delete('/api/v1/admin/collections/999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.delete.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .delete('/api/v1/admin/collections/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/collections/reorder', () => {
    describe('given admin token and orderedIds', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.collection.update
          .mockResolvedValueOnce({ id: 3, position: 0 })
          .mockResolvedValueOnce({ id: 1, position: 1 })
          .mockResolvedValueOnce({ id: 2, position: 2 });

        const res = await request(app)
          .put('/api/v1/admin/collections/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [3, 1, 2] });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given database error during reorder', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/collections/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [1, 2, 3] });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  // ─── PAINTINGS ──────────────────────────────────────────────

  describe('POST /admin/paintings', () => {
    describe('given admin token and valid data', () => {
      it('should return 201 with created painting', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockResolvedValue({
          id: 1,
          title: 'Atardecer',
          imageUrl: 'https://res.cloudinary.com/test/image.jpg',
          dimensions: '80x60 cm',
          technique: 'Óleo sobre lienzo',
          year: 2024,
          isFeatured: false,
          isPublished: true,
          position: 0,
          collectionId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Atardecer',
            imageUrl: 'https://res.cloudinary.com/test/image.jpg',
            collectionId: 1,
            dimensions: '80x60 cm',
            technique: 'Óleo sobre lienzo',
            year: 2024,
          });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('title', 'Atardecer');
        expect(res.body.data).toHaveProperty('collectionId', 1);
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .send({ title: 'Test', imageUrl: 'https://test.com/img.jpg', collectionId: 1 });

        expect(res.status).toBe(401);
      });
    });

    describe('given missing title', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ imageUrl: 'https://test.com/img.jpg', collectionId: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given missing collectionId', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test', imageUrl: 'https://test.com/img.jpg' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test',
            imageUrl: 'https://test.com/img.jpg',
            collectionId: 1,
          });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });

    describe('given multipart file upload', () => {
      it('should upload to Cloudinary and create painting', async () => {
        uploadToCloudinary.mockResolvedValue({
          url: 'https://res.cloudinary.com/test/uploaded.jpg',
          thumbnail: 'https://res.cloudinary.com/test/uploaded_thumb.jpg',
          width: 1200,
          height: 800,
          format: 'jpg',
        });

        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockResolvedValue({
          id: 10,
          title: 'Pintura Upload',
          imageUrl: 'https://res.cloudinary.com/test/uploaded.jpg',
          collectionId: 1,
          isFeatured: false,
          isPublished: true,
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Pintura Upload')
          .field('collectionId', '1')
          .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

        expect(res.status).toBe(201);
        expect(uploadToCloudinary).toHaveBeenCalledWith(
          expect.objectContaining({ mimetype: 'image/jpeg' }),
          'pintura'
        );
        expect(res.body.data).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/uploaded.jpg');
      });
    });

    describe('given no image file and no imageUrl', () => {
      it('should return 400', async () => {
        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Sin imagen')
          .field('collectionId', '1');

        expect(res.status).toBe(400);
      });
    });

    describe('given duplicate title in same collection', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue({ id: 1 });
        mockPrisma.painting.create.mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`title`, `collectionId`)')
        );

        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Atardecer',
            imageUrl: 'https://test.com/img.jpg',
            collectionId: 1,
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });

    describe('given non-existent collectionId', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.collection.findUnique.mockResolvedValue(null);

        const res = await request(app)
          .post('/api/v1/admin/paintings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Pintura sin colección',
            imageUrl: 'https://test.com/img.jpg',
            collectionId: 9999,
          });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
        expect(res.body.error).toBe('La colección no existe');
      });
    });
  });

  describe('PUT /admin/paintings/:id', () => {
    describe('given admin token and valid data', () => {
      it('should return 200 with updated painting', async () => {
        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          title: 'Nuevo',
          imageUrl: 'https://res.cloudinary.com/test/image.jpg',
          collectionId: 1,
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Nuevo' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('title', 'Nuevo');
      });
    });

    describe('given admin token with all fields', () => {
      it('should update all fields', async () => {
        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          imageUrl: 'https://res.cloudinary.com/test/new.jpg',
          dimensions: '100x80 cm',
          technique: 'Acrílico',
          year: 2025,
          collectionId: 2,
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Actualizada',
            imageUrl: 'https://res.cloudinary.com/test/new.jpg',
            dimensions: '100x80 cm',
            technique: 'Acrílico',
            year: 2025,
            collectionId: 2,
          });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('dimensions', '100x80 cm');
        expect(res.body.data).toHaveProperty('technique', 'Acrílico');
        expect(res.body.data).toHaveProperty('year', 2025);
      });
    });

    describe('given painting does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.painting.update.mockRejectedValue(
          new Error('Record to update not found')
        );

        const res = await request(app)
          .put('/api/v1/admin/paintings/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });

    describe('given duplicate title on update', () => {
      it('should return 400 DUPLICATE_ERROR', async () => {
        mockPrisma.painting.update.mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`title`, `collectionId`)')
        );

        const res = await request(app)
          .put('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Atardecer' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'DUPLICATE_ERROR');
      });
    });

    describe('given multipart file upload on update', () => {
      it('should upload new image and update painting', async () => {
        uploadToCloudinary.mockResolvedValue({
          url: 'https://res.cloudinary.com/test/new-upload.jpg',
          thumbnail: 'https://res.cloudinary.com/test/new-upload_thumb.jpg',
          width: 1000,
          height: 700,
          format: 'jpg',
        });

        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          imageUrl: 'https://res.cloudinary.com/test/new-upload.jpg',
          collectionId: 1,
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Actualizada')
          .attach('image', Buffer.from('new-image-data'), 'new.jpg');

        expect(res.status).toBe(200);
        expect(uploadToCloudinary).toHaveBeenCalled();
        expect(res.body.data).toHaveProperty('imageUrl', 'https://res.cloudinary.com/test/new-upload.jpg');
      });
    });
  });

  describe('DELETE /admin/paintings/:id', () => {
    describe('given admin token and existing painting', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.painting.delete.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .delete('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given painting does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.painting.delete.mockRejectedValue(
          new Error('Record to delete does not exist')
        );

        const res = await request(app)
          .delete('/api/v1/admin/paintings/999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.delete.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .delete('/api/v1/admin/paintings/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/paintings/:id/feature', () => {
    describe('given admin token and existing painting', () => {
      it('should toggle isFeatured to true', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue({
          id: 1,
          isFeatured: false,
        });
        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          isFeatured: true,
        });

        const res = await request(app)
          .put('/api/v1/admin/paintings/1/feature')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('isFeatured', true);
      });
    });

    describe('given painting does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue(null);

        const res = await request(app)
          .put('/api/v1/admin/paintings/999/feature')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error during feature update', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue({
          id: 1,
          isFeatured: false,
        });
        mockPrisma.painting.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/paintings/1/feature')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/paintings/:id/publish', () => {
    describe('given admin token and existing painting', () => {
      it('should toggle isPublished', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue({
          id: 1,
          isPublished: true,
        });
        mockPrisma.painting.update.mockResolvedValue({
          id: 1,
          isPublished: false,
        });

        const res = await request(app)
          .put('/api/v1/admin/paintings/1/publish')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('isPublished', false);
      });
    });

    describe('given painting does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue(null);

        const res = await request(app)
          .put('/api/v1/admin/paintings/999/publish')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error during publish', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.findUnique.mockResolvedValue({
          id: 1,
          isPublished: true,
        });
        mockPrisma.painting.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/paintings/1/publish')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/paintings/reorder', () => {
    describe('given admin token and orderedIds with collectionId', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.painting.update
          .mockResolvedValueOnce({ id: 2, position: 0 })
          .mockResolvedValueOnce({ id: 1, position: 1 });

        const res = await request(app)
          .put('/api/v1/admin/paintings/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [2, 1], collectionId: 1 });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given database error during reorder', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.painting.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/paintings/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [1, 2], collectionId: 1 });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

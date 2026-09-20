import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

const app = (await import('../../src/app.js')).default;

describe('HU07 - Admin Exhibitions', () => {
  let adminToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  describe('POST /admin/exhibitions', () => {
    describe('given admin token and valid data', () => {
      it('should return 201 with created exhibition', async () => {
        mockPrisma.exhibition.create.mockResolvedValue({
          id: 1,
          title: 'Muestra Colectiva',
          date: new Date('2025-06-15'),
          location: 'Galeria Central',
          description: 'Exposicion colectiva',
          position: 0,
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/exhibitions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Muestra Colectiva',
            date: '2025-06-15',
            location: 'Galeria Central',
            description: 'Exposicion colectiva',
          });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id', 1);
        expect(res.body.data).toHaveProperty('title', 'Muestra Colectiva');
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .post('/api/v1/admin/exhibitions')
          .send({ title: 'Test', date: '2025-06-15' });

        expect(res.status).toBe(401);
      });
    });

    describe('given missing title', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/exhibitions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ date: '2025-06-15' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given missing date', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/exhibitions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/exhibitions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test', date: '2025-06-15' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/exhibitions/:id', () => {
    describe('given admin token and valid data', () => {
      it('should return 200 with updated exhibition', async () => {
        mockPrisma.exhibition.update.mockResolvedValue({
          id: 1,
          title: 'Actualizada',
          date: new Date('2025-07-20'),
          location: 'Galeria Norte',
          description: 'Nueva descripcion',
          position: 0,
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/exhibitions/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Actualizada' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('title', 'Actualizada');
      });
    });

    describe('given exhibition does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to update not found');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.update.mockRejectedValue(notFoundError);

        const res = await request(app)
          .put('/api/v1/admin/exhibitions/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/exhibitions/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('DELETE /admin/exhibitions/:id', () => {
    describe('given admin token and existing exhibition', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.exhibition.delete.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .delete('/api/v1/admin/exhibitions/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given exhibition does not exist', () => {
      it('should return 404 NOT_FOUND', async () => {
        const notFoundError = new Error('Record to delete does not exist');
        notFoundError.code = 'P2025';
        mockPrisma.exhibition.delete.mockRejectedValue(notFoundError);

        const res = await request(app)
          .delete('/api/v1/admin/exhibitions/999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.delete.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .delete('/api/v1/admin/exhibitions/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/exhibitions/reorder', () => {
    describe('given admin token and orderedIds', () => {
      it('should return 200 with success message', async () => {
        mockPrisma.exhibition.update
          .mockResolvedValueOnce({ id: 2, position: 0 })
          .mockResolvedValueOnce({ id: 1, position: 1 });

        const res = await request(app)
          .put('/api/v1/admin/exhibitions/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [2, 1] });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('message');
      });
    });

    describe('given database error during reorder', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.exhibition.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/exhibitions/reorder')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orderedIds: [1, 2] });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

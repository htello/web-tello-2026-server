import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

const app = (await import('../../src/app.js')).default;

describe('HU12 - Admin Biography', () => {
  let adminToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  describe('POST /admin/biography', () => {
    describe('given admin token and no existing biography', () => {
      it('should return 201 with created biography', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);
        mockPrisma.biography.create.mockResolvedValue({
          id: 1,
          content: 'Nueva biografía',
          imageUrl: null,
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Nueva biografía' });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('content', 'Nueva biografía');
      });
    });

    describe('given admin token and existing biography', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .post('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Nueva biografía' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .post('/api/v1/admin/biography')
          .send({ content: 'Nueva biografía' });

        expect(res.status).toBe(401);
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.biography.findFirst.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Nueva biografía' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });

  describe('PUT /admin/biography', () => {
    describe('given admin token and existing biography', () => {
      it('should return 200 with updated biography', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Biografía actualizada',
          updatedAt: new Date(),
        });

        const res = await request(app)
          .put('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Biografía actualizada' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('content', 'Biografía actualizada');
      });

      it('should update only the image without requiring content', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({
          id: 1,
          content: 'Contenido existente de la biografía',
          imageUrl: 'https://example.com/old.jpg',
        });
        mockPrisma.biography.update.mockResolvedValue({
          id: 1,
          content: 'Contenido existente de la biografía',
          imageUrl: 'https://example.com/new.jpg',
        });

        const res = await request(app)
          .put('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ imageUrl: 'https://example.com/new.jpg' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('content', 'Contenido existente de la biografía');
      });
    });

    describe('given admin token and no existing biography', () => {
      it('should return 404 NOT_FOUND', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue(null);

        const res = await request(app)
          .put('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Nueva biografía' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('given missing content', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .put('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error on update', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.biography.findFirst.mockResolvedValue({ id: 1 });
        mockPrisma.biography.update.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .put('/api/v1/admin/biography')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Contenido de prueba para la biografía' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});

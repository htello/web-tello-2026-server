/**
 * @fileoverview Tests de integración de la recuperación de contraseña.
 *
 * Verifica los endpoints públicos POST /api/v1/auth/forgot-password
 * y POST /api/v1/auth/reset-password.
 *
 * @module tests/integration/password-reset
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { sendPasswordResetEmail } from '../../src/services/email.js';
import { forgotPasswordLimiter, resetPasswordLimiter } from '../../src/middleware/rateLimiter.js';

vi.mock('../../src/services/email.js', () => ({
  sendContactEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const app = (await import('../../src/app.js')).default;

describe('Recuperación de contraseña', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await forgotPasswordLimiter.resetKey('127.0.0.1');
    await resetPasswordLimiter.resetKey('127.0.0.1');
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 with generic message for unregistered email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('message');
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return 200 and send email for registered user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'admin@test.com' });
      mockPrisma.user.update.mockResolvedValue({ id: 1 });
      sendPasswordResetEmail.mockResolvedValue({ success: true });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'admin@test.com' });

      expect(res.status).toBe(200);
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
          }),
        })
      );
    });

    it('should return 400 VALIDATION_ERROR when email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 429 on the 6th request within the window', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      for (let i = 0; i < 5; i += 1) {
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'ghost@test.com' });
        expect(res.status).toBe(200);
      }

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost@test.com' });

      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('code', 'RATE_LIMITED');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 200 and update password with valid token', async () => {
      const hashedToken = createHash('sha256').update('raw-token').digest('hex');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      });
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'raw-token', password: 'NuevaClave1!' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('message', 'Contraseña actualizada correctamente');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordResetToken: null,
            passwordResetExpires: null,
          }),
        })
      );
    });

    it('should return 400 with unknown token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'unknown', password: 'NuevaClave1!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Token inválido o expirado',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return 400 VALIDATION_ERROR when password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'raw-token' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});

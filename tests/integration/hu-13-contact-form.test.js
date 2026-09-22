/**
 * @fileoverview Tests de integración de HU13 - Formulario de Contacto.
 *
 * Verifica el endpoint público POST /api/v1/contact.
 *
 * @module tests/integration/hu-13-contact-form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { sendContactEmail } from '../../src/services/email.js';
import { contactLimiter } from '../../src/middleware/rateLimiter.js';

vi.mock('../../src/services/email.js', () => ({
  sendContactEmail: vi.fn(),
}));

const app = (await import('../../src/app.js')).default;

const validBody = {
  name: 'Juan García',
  email: 'juan@ejemplo.com',
  subject: 'Consulta sobre obra',
  message: 'Me interesa esta pieza',
};

describe('HU13 - Formulario de Contacto', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sendContactEmail.mockResolvedValue({ success: true });
    await contactLimiter.resetKey('127.0.0.1');
  });

  describe('POST /api/v1/contact', () => {
    it('should return 201 when message is sent', async () => {
      const res = await request(app).post('/api/v1/contact').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({ message: 'Mensaje enviado correctamente' });
      expect(sendContactEmail).toHaveBeenCalledWith(validBody);
    });

    it('should return 400 when name is missing', async () => {
      const { name, ...body } = validBody;

      const res = await request(app).post('/api/v1/contact').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 when email is missing', async () => {
      const { email, ...body } = validBody;

      const res = await request(app).post('/api/v1/contact').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 when message is missing', async () => {
      const { message, ...body } = validBody;

      const res = await request(app).post('/api/v1/contact').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 500 when email service fails', async () => {
      sendContactEmail.mockRejectedValue(new Error('SMTP down'));

      const res = await request(app).post('/api/v1/contact').send(validBody);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });

    it('should return 502 EMAIL_ERROR when sending reports failure', async () => {
      sendContactEmail.mockResolvedValue({ success: false, error: 'SMTP down' });

      const res = await request(app).post('/api/v1/contact').send(validBody);

      expect(res.status).toBe(502);
      expect(res.body).toEqual({
        error: 'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde',
        code: 'EMAIL_ERROR',
      });
    });

    it('should return 429 on the 6th request within a minute', async () => {
      for (let i = 0; i < 5; i += 1) {
        const res = await request(app).post('/api/v1/contact').send(validBody);
        expect(res.status).toBe(201);
      }

      const res = await request(app).post('/api/v1/contact').send(validBody);

      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('code', 'RATE_LIMITED');
    });
  });
});

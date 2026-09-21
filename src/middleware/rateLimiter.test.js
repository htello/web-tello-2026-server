/**
 * @fileoverview Tests unitarios de HU15 - Rate Limiting.
 *
 * Verifica el middleware de rate limiting del formulario de contacto.
 *
 * @module middleware/rateLimiter.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

let contactLimiter;
let createContactLimiter;

beforeEach(async () => {
  vi.resetModules();
  ({ contactLimiter, createContactLimiter } = await import('./rateLimiter.js'));
});

const createApp = (limiter) => {
  const app = express();
  app.use(limiter);
  app.post('/contact', (req, res) => {
    res.status(201).json({ data: { ok: true } });
  });
  return app;
};

describe('HU15 - Rate Limiting', () => {
  it('should allow the first 5 requests', async () => {
    const app = createApp(contactLimiter);

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/contact').send({});
      expect(res.status).toBe(201);
    }
  });

  it('should block the 6th request with 429 RATE_LIMITED', async () => {
    const app = createApp(contactLimiter);

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/contact').send({});
    }

    const res = await request(app).post('/contact').send({});

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.',
      code: 'RATE_LIMITED',
    });
  });

  it('should allow requests again after the window elapses', async () => {
    const limiter = createContactLimiter({ windowMs: 50, max: 5 });
    const app = createApp(limiter);

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/contact').send({});
    }

    const blocked = await request(app).post('/contact').send({});
    expect(blocked.status).toBe(429);

    await new Promise((resolve) => setTimeout(resolve, 80));

    const allowed = await request(app).post('/contact').send({});
    expect(allowed.status).toBe(201);
  });
});

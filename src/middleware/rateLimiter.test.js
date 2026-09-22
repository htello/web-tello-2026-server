/**
 * @fileoverview Tests unitarios de HU15 - Rate Limiting.
 *
 * Verifica el middleware de rate limiting del formulario de contacto.
 *
 * @module middleware/rateLimiter.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

let contactLimiter;
let createContactLimiter;

beforeEach(async () => {
  vi.resetModules();
  ({ contactLimiter, createContactLimiter } = await import('./rateLimiter.js'));
});

afterEach(() => {
  vi.useRealTimers();
});

const createApp = (limiter) => {
  const app = express();
  app.use(limiter);
  app.post('/contact', (req, res) => {
    res.status(201).json({ data: { ok: true } });
  });
  return app;
};

const invoke = async (limiter) => {
  const req = {
    ip: '10.0.0.1',
    headers: {},
    app: { get: () => false },
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
    headersSent: false,
  };
  const next = vi.fn();
  await limiter(req, res, next);
  return { res, next };
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
    vi.useFakeTimers();
    const limiter = createContactLimiter();

    for (let i = 0; i < 5; i += 1) {
      const { next } = await invoke(limiter);
      expect(next).toHaveBeenCalled();
    }

    const blocked = await invoke(limiter);
    expect(blocked.res.status).toHaveBeenCalledWith(429);
    expect(blocked.next).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);

    const allowed = await invoke(limiter);
    expect(allowed.next).toHaveBeenCalled();
  });
});

/**
 * @fileoverview Tests unitarios del servicio de monitoreo de errores con Sentry.
 *
 * Verifica que Sentry solo se inicializa cuando existe SENTRY_DSN
 * y que configura la integración de Express y el sample rate de tracing.
 *
 * @module services/sentry.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

const { initMock, expressIntegrationMock } = vi.hoisted(() => ({
  initMock: vi.fn(),
  expressIntegrationMock: vi.fn(() => ({ name: 'Express' })),
}));

vi.mock('@sentry/node', () => ({
  init: initMock,
  expressIntegration: expressIntegrationMock,
}));

describe('Sentry service', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    initMock.mockClear();
    expressIntegrationMock.mockClear();
  });

  it('should initialize Sentry with expressIntegration when SENTRY_DSN is set', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://example@ingest.sentry.io/123');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SENTRY_RELEASE', 'hu/13-contacto@abc123');

    const { isEnabled } = await import('./sentry.js');

    expect(isEnabled).toBe(true);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://example@ingest.sentry.io/123',
      environment: 'production',
      release: 'hu/13-contacto@abc123',
      tracesSampleRate: 1.0,
    }));
    expect(expressIntegrationMock).toHaveBeenCalledTimes(1);
  });

  it('should default environment to development when NODE_ENV is missing', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://example@ingest.sentry.io/123');
    vi.stubEnv('NODE_ENV', '');

    await import('./sentry.js');

    expect(initMock).toHaveBeenCalledWith(expect.objectContaining({
      environment: 'development',
    }));
  });

  it('should not initialize Sentry when SENTRY_DSN is missing', async () => {
    vi.stubEnv('SENTRY_DSN', '');

    const { isEnabled } = await import('./sentry.js');

    expect(isEnabled).toBe(false);
    expect(initMock).not.toHaveBeenCalled();
    expect(expressIntegrationMock).not.toHaveBeenCalled();
  });
});

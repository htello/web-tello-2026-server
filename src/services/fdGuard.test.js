/**
 * @fileoverview Tests unitarios del guard de errores de I/O en stdout/stderr.
 *
 * Verifica que los códigos de error ignorables no provocan excepciones
 * no capturadas y que los listeners se registran una sola vez.
 *
 * @module services/fdGuard.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('fdGuard service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should swallow ignorable fd error codes', async () => {
    const { ignoreFdError, IGNORABLE_CODES } = await import('./fdGuard.js');

    IGNORABLE_CODES.forEach((code) => {
      const err = new Error('fd write failed');
      err.code = code;
      expect(() => ignoreFdError(err)).not.toThrow();
    });
  });

  it('should rethrow unknown error codes', async () => {
    const { ignoreFdError } = await import('./fdGuard.js');
    const err = new Error('boom');
    err.code = 'EBOOM';

    expect(() => ignoreFdError(err)).toThrow(err);
  });

  it('should rethrow errors without code', async () => {
    const { ignoreFdError } = await import('./fdGuard.js');

    expect(() => ignoreFdError(new Error('no code'))).toThrow('no code');
  });

  it('should attach ignoreFdError to stdout and stderr only once', async () => {
    const { attachFdGuard, ignoreFdError } = await import('./fdGuard.js');
    const beforeOut = process.stdout.listenerCount('error');
    const beforeErr = process.stderr.listenerCount('error');

    attachFdGuard();

    expect(process.stdout.listenerCount('error')).toBe(beforeOut + 1);
    expect(process.stderr.listenerCount('error')).toBe(beforeErr + 1);
    expect(process.stdout.listeners('error')).toContain(ignoreFdError);
    expect(process.stderr.listeners('error')).toContain(ignoreFdError);

    attachFdGuard();

    expect(process.stdout.listenerCount('error')).toBe(beforeOut + 1);
    expect(process.stderr.listenerCount('error')).toBe(beforeErr + 1);

    process.stdout.removeListener('error', ignoreFdError);
    process.stderr.removeListener('error', ignoreFdError);
  });
});

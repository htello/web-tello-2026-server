/**
 * @fileoverview Tests unitarios de las constantes de configuración.
 *
 * Cubre ambas ramas del fallback de JWT_SECRET (process.env || default)
 * reimportando el módulo con distintos estados de entorno, de forma que
 * la cobertura de ramas sea 100% tanto en local como en CI.
 *
 * @module lib/constants.test
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

describe('lib/constants', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('JWT_SECRET', () => {
    it('should use process.env.JWT_SECRET when defined', async () => {
      vi.stubEnv('JWT_SECRET', 'env-secret-key-minimum-32-characters');
      vi.resetModules();
      const { JWT_SECRET } = await import('./constants.js');
      expect(JWT_SECRET).toBe('env-secret-key-minimum-32-characters');
    });

    it('should fall back to the default secret when process.env.JWT_SECRET is empty', async () => {
      vi.stubEnv('JWT_SECRET', '');
      vi.resetModules();
      const { JWT_SECRET } = await import('./constants.js');
      expect(JWT_SECRET).toBe('test-secret-key-for-ci-minimum-32-characters');
    });
  });

  describe('otras constantes', () => {
    it('should export JWT_EXPIRATION, BCRYPT_ROUNDS and DESIGN_SUBCATEGORIES', async () => {
      const { JWT_EXPIRATION, BCRYPT_ROUNDS, DESIGN_SUBCATEGORIES } = await import('./constants.js');
      expect(JWT_EXPIRATION).toBe('24h');
      expect(BCRYPT_ROUNDS).toBe(12);
      expect(DESIGN_SUBCATEGORIES).toEqual([
        'imagen-corporativa',
        'packaging-expositores',
        'carteleria',
        'editorial',
      ]);
    });
  });
});

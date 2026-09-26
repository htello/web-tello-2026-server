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

  describe('FRONTEND_URL', () => {
    it('should use process.env.FRONTEND_URL when defined', async () => {
      vi.stubEnv('FRONTEND_URL', 'https://portfolio.example.com');
      vi.resetModules();
      const { FRONTEND_URL } = await import('./constants.js');
      expect(FRONTEND_URL).toBe('https://portfolio.example.com');
    });

    it('should fall back to localhost when process.env.FRONTEND_URL is empty', async () => {
      vi.stubEnv('FRONTEND_URL', '');
      vi.resetModules();
      const { FRONTEND_URL } = await import('./constants.js');
      expect(FRONTEND_URL).toBe('http://localhost:5173');
    });
  });

  describe('otras constantes', () => {
    it('should export JWT_EXPIRATION, BCRYPT_ROUNDS, RESET_TOKEN_EXPIRES_MINUTES and DESIGN_SUBCATEGORIES', async () => {
      const { JWT_EXPIRATION, BCRYPT_ROUNDS, RESET_TOKEN_EXPIRES_MINUTES, DESIGN_SUBCATEGORIES } = await import('./constants.js');
      expect(JWT_EXPIRATION).toBe('24h');
      expect(BCRYPT_ROUNDS).toBe(12);
      expect(RESET_TOKEN_EXPIRES_MINUTES).toBe(60);
      expect(DESIGN_SUBCATEGORIES).toEqual([
        'imagen-corporativa',
        'packaging-expositores',
        'carteleria',
        'editorial',
      ]);
    });
  });

  describe('constantes de paginación', () => {
    it('should export pagination defaults and bounds', async () => {
      const {
        PAGINATION_DEFAULT_PAGE,
        PAGINATION_DEFAULT_LIMIT,
        PAGINATION_MIN_LIMIT,
        PAGINATION_MAX_LIMIT,
      } = await import('./constants.js');
      expect(PAGINATION_DEFAULT_PAGE).toBe(1);
      expect(PAGINATION_DEFAULT_LIMIT).toBe(20);
      expect(PAGINATION_MIN_LIMIT).toBe(1);
      expect(PAGINATION_MAX_LIMIT).toBe(100);
    });
  });

  describe('constantes de rate limiting', () => {
    it('should export rate limit windows and maximums', async () => {
      const {
        RATE_LIMIT_WINDOW_MS,
        RATE_LIMIT_CONTACT_MAX,
        RATE_LIMIT_LOGIN_MAX,
        RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
        RATE_LIMIT_PASSWORD_RESET_MAX,
      } = await import('./constants.js');
      expect(RATE_LIMIT_WINDOW_MS).toBe(60 * 1000);
      expect(RATE_LIMIT_CONTACT_MAX).toBe(5);
      expect(RATE_LIMIT_LOGIN_MAX).toBe(10);
      expect(RATE_LIMIT_PASSWORD_RESET_WINDOW_MS).toBe(15 * 60 * 1000);
      expect(RATE_LIMIT_PASSWORD_RESET_MAX).toBe(5);
    });
  });

  describe('constantes de imágenes', () => {
    it('should export Cloudinary image widths', async () => {
      const { IMAGE_MAX_WIDTH, IMAGE_THUMBNAIL_WIDTH } = await import('./constants.js');
      expect(IMAGE_MAX_WIDTH).toBe(1200);
      expect(IMAGE_THUMBNAIL_WIDTH).toBe(300);
    });
  });

  describe('constantes de validación', () => {
    it('should export Joi validation bounds', async () => {
      const {
        MAX_EXHIBITION_IMAGES,
        EXHIBITION_YEAR_MIN,
        EXHIBITION_YEAR_MAX,
        MIN_TEXT_LENGTH,
      } = await import('./constants.js');
      expect(MAX_EXHIBITION_IMAGES).toBe(50);
      expect(EXHIBITION_YEAR_MIN).toBe(1900);
      expect(EXHIBITION_YEAR_MAX).toBe(2100);
      expect(MIN_TEXT_LENGTH).toBe(10);
    });
  });

  describe('constantes SMTP', () => {
    it('should export SMTP ports and timeouts', async () => {
      const {
        SMTP_DEFAULT_PORT,
        SMTP_SECURE_PORT,
        SMTP_CONNECTION_TIMEOUT_MS,
        SMTP_GREETING_TIMEOUT_MS,
        SMTP_SOCKET_TIMEOUT_MS,
      } = await import('./constants.js');
      expect(SMTP_DEFAULT_PORT).toBe(587);
      expect(SMTP_SECURE_PORT).toBe(465);
      expect(SMTP_CONNECTION_TIMEOUT_MS).toBe(10000);
      expect(SMTP_GREETING_TIMEOUT_MS).toBe(10000);
      expect(SMTP_SOCKET_TIMEOUT_MS).toBe(30000);
    });
  });

  describe('constantes de auth', () => {
    it('should export RESET_TOKEN_BYTES', async () => {
      const { RESET_TOKEN_BYTES } = await import('./constants.js');
      expect(RESET_TOKEN_BYTES).toBe(32);
    });
  });
});

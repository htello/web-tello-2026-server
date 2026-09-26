/**
 * @fileoverview Middlewares de rate limiting.
 *
 * Centraliza la configuración de express-rate-limit para los endpoints
 * sensibles: formulario de contacto y login (OWASP A07).
 *
 * @module middleware/rateLimiter
 * @requires express-rate-limit
 */

import rateLimit from 'express-rate-limit';
import {
  ERROR_CODES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_CONTACT_MAX,
  RATE_LIMIT_LOGIN_MAX,
  RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
  RATE_LIMIT_PASSWORD_RESET_MAX,
} from '../lib/constants.js';

/**
 * Crea un limiter de contacto con la configuración indicada.
 *
 * @param {Object} [options] - Opciones adicionales para sobreescribir
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Middleware de rate limiting
 */
const createContactLimiter = (options = {}) => rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_CONTACT_MAX,
  message: {
    error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.',
    code: ERROR_CODES.RATE_LIMITED,
  },
  ...options,
});

/**
 * Crea un limiter de login con la configuración indicada.
 *
 * @param {Object} [options] - Opciones adicionales para sobreescribir
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Middleware de rate limiting
 */
const createLoginLimiter = (options = {}) => rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_LOGIN_MAX,
  message: {
    error: 'Demasiados intentos de inicio de sesión',
    code: ERROR_CODES.RATE_LIMITED,
  },
  ...options,
});

/**
 * Crea un limiter de recuperación de contraseña con la configuración indicada.
 *
 * @param {Object} [options] - Opciones adicionales para sobreescribir
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Middleware de rate limiting
 */
const createPasswordResetLimiter = (options = {}) => rateLimit({
  windowMs: RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
  max: RATE_LIMIT_PASSWORD_RESET_MAX,
  message: {
    error: `Demasiadas solicitudes de recuperación. Intenta de nuevo en ${RATE_LIMIT_PASSWORD_RESET_WINDOW_MS / RATE_LIMIT_WINDOW_MS} minutos.`,
    code: ERROR_CODES.RATE_LIMITED,
  },
  ...options,
});

/** Limiter por defecto para POST /api/v1/contact. */
const contactLimiter = createContactLimiter();

/** Limiter por defecto para POST /api/v1/auth/login. */
const loginLimiter = createLoginLimiter();

/** Limiter por defecto para POST /api/v1/auth/forgot-password. */
const forgotPasswordLimiter = createPasswordResetLimiter();

/** Limiter por defecto para POST /api/v1/auth/reset-password. */
const resetPasswordLimiter = createPasswordResetLimiter();

export {
  contactLimiter,
  createContactLimiter,
  loginLimiter,
  createLoginLimiter,
  createPasswordResetLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};

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

/**
 * Crea un limiter de contacto con la configuración indicada.
 *
 * @param {Object} [options] - Opciones adicionales para sobreescribir
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Middleware de rate limiting
 */
const createContactLimiter = (options = {}) => rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.',
    code: 'RATE_LIMITED',
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
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiados intentos de inicio de sesión',
    code: 'RATE_LIMITED',
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
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Demasiadas solicitudes de recuperación. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMITED',
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

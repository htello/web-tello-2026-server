/**
 * @fileoverview Middleware de rate limiting para el formulario de contacto.
 *
 * Aplica express-rate-limit con una ventana de 1 minuto y un máximo de
 * 5 peticiones por IP para prevenir el abuso del formulario (OWASP A07).
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

/** Limiter por defecto para POST /api/v1/contact. */
const contactLimiter = createContactLimiter();

export { contactLimiter, createContactLimiter };

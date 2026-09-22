/**
 * @fileoverview Rutas de autenticación.
 *
 * Define los endpoints para login y registro de usuarios.
 * Usa validación Joi para sanitizar input (OWASP A05).
 *
 * @module routes/auth
 * @requires express
 * @requires controllers/auth
 * @requires middleware/validate
 */

import { Router } from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/auth.js';
import { validate, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate.js';
import { forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /login
 * HU20 - Login Admin
 *
 * Autentica al administrador con email y password.
 * Retorna JWT token y datos del usuario.
 *
 * @security Rate limited: 10 req/min
 * @param {string} email - Email del usuario (requerido, formato válido)
 * @param {string} password - Contraseña (requerido, mínimo 8 caracteres)
 * @returns {Object} 200 - { data: { token, user } }
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 401 - Credenciales inválidas
 */
router.post('/login', validate(loginSchema), login);

/**
 * POST /forgot-password
 * Recuperación de contraseña (paso 1: solicitar enlace)
 *
 * Responde siempre 200 genérico; si el email existe, envía el enlace
 * con token de un solo uso (1 h de validez).
 *
 * @security Rate limited: 5 req/15min
 * @param {string} email - Email del usuario (requerido, formato válido)
 * @returns {Object} 200 - { data: { message } } genérico
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 429 - Rate limit excedido
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

/**
 * POST /reset-password
 * Recuperación de contraseña (paso 2: nueva contraseña con token)
 *
 * @security Rate limited: 5 req/15min
 * @param {string} token - Token del enlace recibido por email (requerido)
 * @param {string} password - Nueva contraseña (fuerte: ≥8, mayúscula y símbolo)
 * @returns {Object} 200 - { data: { message } }
 * @returns {Object} 400 - Token inválido/expirado o error de validación
 * @returns {Object} 429 - Rate limit excedido
 */
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

export default router;

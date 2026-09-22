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
import { login } from '../controllers/auth.js';
import { validate, loginSchema } from '../middleware/validate.js';

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

export default router;

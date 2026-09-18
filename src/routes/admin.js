/**
 * @fileoverview Rutas de administración.
 *
 * Define los endpoints para gestión de usuarios admin y upload de archivos.
 * Todos los endpoints requieren autenticación JWT.
 *
 * @module routes/admin
 * @requires express
 * @requires controllers/auth
 * @requires routes/upload
 * @requires middleware/auth
 * @requires middleware/validate
 */

import { Router } from 'express';
import { register } from '../controllers/auth.js';
import { validate, registerSchema } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import uploadRoutes from './upload.js';

const router = Router();

/**
 * POST /users/register
 * HU22 - Registro de Administradores
 *
 * Registra un nuevo usuario con rol ADMIN.
 * Requiere JWT válido de un administrador autenticado.
 *
 * @security Rate limited: 10 req/min
 * @param {string} email - Email del usuario (requerido, formato válido)
 * @param {string} password - Contraseña (requerido, mínimo 8 caracteres)
 * @param {string} [name] - Nombre del usuario (opcional)
 * @returns {Object} 201 - { data: { id, email, name, role } }
 * @returns {Object} 400 - Error de validación o email duplicado
 * @returns {Object} 401 - Token no proporcionado
 * @returns {Object} 403 - Token inválido o no admin
 */
router.post(
  '/users/register',
  authenticate,
  requireAdmin,
  validate(registerSchema),
  register
);

/**
 * Rutas de upload
 * - POST /upload → HU16: Upload de Archivos (requiere auth)
 */
router.use('/upload', uploadRoutes);

export default router;

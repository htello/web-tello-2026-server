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
import collectionsRoutes from './collections.js';
import paintingsRoutes from './paintings.js';
import exhibitionsRoutes from './exhibitions.js';
import designRoutes from './design.js';
import illustrationsRoutes from './illustrations.js';
import biographyRoutes from './biography.js';

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

/**
 * Rutas de colecciones
 * - POST /collections → HU06: Crear colección
 * - PUT /collections/:id → HU06: Actualizar colección
 * - DELETE /collections/:id → HU06: Eliminar colección
 * - PUT /collections/reorder → HU06: Reordenar colecciones
 */
router.use('/collections', collectionsRoutes);

/**
 * Rutas de pinturas
 * - POST /paintings → HU06: Crear pintura
 * - PUT /paintings/:id → HU06: Actualizar pintura
 * - DELETE /paintings/:id → HU06: Eliminar pintura
 * - PUT /paintings/:id/feature → HU06: Toggle destacada
 * - PUT /paintings/:id/publish → HU06: Toggle publicada
 * - PUT /paintings/reorder → HU06: Reordenar pinturas
 */
router.use('/paintings', paintingsRoutes);

/**
 * Rutas de exposiciones
 * - POST /exhibitions → HU07: Crear exposición
 * - PUT /exhibitions/:id → HU07: Actualizar exposición
 * - DELETE /exhibitions/:id → HU07: Eliminar exposición
 * - PUT /exhibitions/reorder → HU07: Reordenar exposiciones
 */
router.use('/exhibitions', exhibitionsRoutes);

/**
 * Rutas de diseño
 * - POST /design → HU10: Crear proyecto de diseño
 * - PUT /design/:id → HU10: Actualizar proyecto de diseño
 * - DELETE /design/:id → HU10: Eliminar proyecto de diseño
 */
router.use('/design', designRoutes);

/**
 * Rutas de ilustraciones
 * - POST /illustrations → HU10: Crear ilustración
 * - PUT /illustrations/:id → HU10: Actualizar ilustración
 * - DELETE /illustrations/:id → HU10: Eliminar ilustración
 */
router.use('/illustrations', illustrationsRoutes);

/**
 * Rutas de biografía
 * - GET /biography → HU12: Obtener biografía
 * - PUT /biography → HU12: Crear/actualizar biografía
 */
router.use('/biography', biographyRoutes);

export default router;

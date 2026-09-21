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
import uploadRoutes from './upload.js';
import usersRoutes from './users.js';
import collectionsRoutes from './collections.js';
import paintingsRoutes from './paintings.js';
import exhibitionsRoutes from './exhibitions.js';
import designRoutes from './design.js';
import illustrationsRoutes from './illustrations.js';
import biographyRoutes from './biography.js';

const router = Router();

/**
 * Rutas de usuarios
 * - POST /users/register → HU22: Registro de Administradores (requiere auth)
 * - GET /users → Gestión: listar usuarios
 * - GET /users/:id → Gestión: detalle de usuario
 * - PUT /users/:id → Gestión: editar usuario
 * - DELETE /users/:id → Gestión: eliminar usuario
 * - PUT /users/:id/password → Gestión: resetear contraseña
 */
router.use('/users', usersRoutes);

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

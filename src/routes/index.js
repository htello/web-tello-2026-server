/**
 * @fileoverview Router principal de la API v1.
 *
 * Centraliza todas las rutas de la aplicación bajo /api/v1.
 * Cada módulo de rutas se registra aquí según corresponda.
 *
 * @module routes
 * @requires express
 */

import { Router } from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import { publicRouter as collectionsPublicRoutes } from './collections.js';
import { publicRouter as paintingsPublicRoutes } from './paintings.js';
import { publicRouter as exhibitionsPublicRoutes } from './exhibitions.js';
import { publicRouter as designPublicRoutes } from './design.js';
import { publicRouter as illustrationsPublicRoutes } from './illustrations.js';
import { publicRouter as biographyPublicRoutes } from './biography.js';

const router = Router();

/**
 * Rutas de autenticación
 * - POST /auth/login → HU20: Login Admin
 */
router.use('/auth', authRoutes);

/**
 * Rutas públicas de galería
 * - GET /collections → HU01: Galería de Colecciones
 */
router.use('/collections', collectionsPublicRoutes);

/**
 * Rutas públicas de pinturas
 * - GET /paintings/:id → HU03: Ficha de pintura
 */
router.use('/paintings', paintingsPublicRoutes);

/**
 * Rutas públicas de exposiciones
 * - GET /exhibitions → HU05: Listar exposiciones
 */
router.use('/exhibitions', exhibitionsPublicRoutes);

/**
 * Rutas públicas de diseño
 * - GET /design → HU08: Filtrar proyectos de diseño
 */
router.use('/design', designPublicRoutes);

/**
 * Rutas públicas de ilustraciones
 * - GET /illustrations → HU09: Galería de ilustraciones
 */
router.use('/illustrations', illustrationsPublicRoutes);

/**
 * Rutas públicas de biografía
 * - GET /biography → HU11: Leer biografía
 */
router.use('/biography', biographyPublicRoutes);

/**
 * Rutas de administración
 * - POST /admin/users/register → HU22: Registro Admin (requiere auth)
 */
router.use('/admin', adminRoutes);

export default router;

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

const router = Router();

/**
 * Rutas de autenticación
 * - POST /auth/login → HU20: Login Admin
 */
router.use('/auth', authRoutes);

/**
 * Rutas de administración
 * - POST /admin/users/register → HU22: Registro Admin (requiere auth)
 */
router.use('/admin', adminRoutes);

export default router;

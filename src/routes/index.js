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

const router = Router();

/**
 * Rutas de autenticación
 * - POST /auth/login → HU20: Login Admin
 * - POST /auth/register → (futuro)
 */
router.use('/auth', authRoutes);

export default router;

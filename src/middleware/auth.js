/**
 * @fileoverview Middlewares de autenticación (JWT) y autorización (roles).
 *
 * @module middleware/auth
 * @requires jsonwebtoken
 * @requires lib/constants
 * @requires lib/http-response
 * @requires services/logger
 */

import jwt from 'jsonwebtoken';
import logger from '../services/logger.js';
import { JWT_SECRET, ADMIN_ROLE, ERROR_CODES } from '../lib/constants.js';
import { sendError, sendUnauthorized } from '../lib/http-response.js';

/**
 * Middleware de autenticación JWT
 * Verifica el token Bearer en el header Authorization
 *
 * @param {Object} req.headers.authorization - Bearer <token>
 * @returns {Object} 401 - Token no proporcionado
 * @returns {Object} 403 - Token inválido o expirado
 * @returns {Function} next - Si el token es válido, adjunta req.user
 *
 * @example
 * router.get('/admin', authenticate, controller);
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'Token de autenticación requerido');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', { error: error.message });
    return sendError(res, 403, ERROR_CODES.FORBIDDEN, 'Token inválido o expirado');
  }
};

/**
 * Middleware de autorización por rol
 * Requiere que req.user.role === 'ADMIN'
 * Debe usarse después de authenticate
 *
 * @returns {Object} 403 - Acceso denegado
 * @returns {Function} next - Si el usuario es ADMIN
 *
 * @example
 * router.delete('/admin/users/:id', authenticate, requireAdmin, controller);
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ADMIN_ROLE) {
    return sendError(res, 403, ERROR_CODES.FORBIDDEN, 'Acceso denegado. Se requiere rol de administrador');
  }
  next();
};

export { authenticate, requireAdmin };

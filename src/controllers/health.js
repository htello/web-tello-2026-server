/**
 * @fileoverview Controlador de health checks.
 *
 * Expone la comprobación de conectividad con la base de datos
 * usada por monitorización externa (pings anti-pausa de free tiers).
 *
 * @module controllers/health
 * @requires lib/prisma
 * @requires lib/http-response
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { sendSuccess, sendError } from '../lib/http-response.js';

/**
 * Comprueba la conectividad con la base de datos.
 * Endpoint GET /api/v1/health/db
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con db operativa o 503 si no responde
 * @security Endpoint público (no requiere autenticación)
 */
const dbCheck = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return sendSuccess(res, {
      status: 'ok',
      db: 'up',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check de BD fallido', { error: error.message });
    return sendError(res, 503, 'SERVICE_UNAVAILABLE', 'Base de datos no disponible');
  }
};

export { dbCheck };

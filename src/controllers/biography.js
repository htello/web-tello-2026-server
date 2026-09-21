/**
 * @fileoverview Controlador de biografía.
 *
 * Implementa los handlers públicos (HU11) y de administración
 * (HU12) para la biografía del artista.
 *
 * @module controllers/biography
 * @requires lib/prisma
 * @requires lib/http-response
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { sendSuccess, sendNotFound, sendInternalError } from '../lib/http-response.js';

/**
 * HU11 - Leer biografía
 * Endpoint GET /api/v1/biography
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con biografía, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const get = async (req, res) => {
  try {
    const biography = await prisma.biography.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!biography) return sendNotFound(res, 'Biografía no encontrada');

    return sendSuccess(res, biography);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener biografía', error);
  }
};

/**
 * HU12 - Crear o actualizar biografía
 * Endpoint PUT /api/v1/admin/biography
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con biografía guardada o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const createOrUpdate = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    const existing = await prisma.biography.findFirst();

    let biography;
    if (existing) {
      biography = await prisma.biography.update({
        where: { id: existing.id },
        data: { content, imageUrl: imageUrl || null },
      });
      logger.info('Biografía actualizada', { id: biography.id });
    } else {
      biography = await prisma.biography.create({
        data: { content, imageUrl: imageUrl || null },
      });
      logger.info('Biografía creada', { id: biography.id });
    }

    return sendSuccess(res, biography);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al guardar biografía', error);
  }
};

export { get, createOrUpdate };

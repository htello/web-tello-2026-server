/**
 * @fileoverview Controlador de exposiciones.
 *
 * Implementa los handlers públicos (HU05) y de administración
 * (HU07) para la galería de exposiciones.
 *
 * @module controllers/exhibitions
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/http-response
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { parseId, isNotFoundError, reorderByPosition } from '../lib/prisma-utils.js';
import { sendSuccess, sendError, sendNotFound, sendInternalError } from '../lib/http-response.js';
import { STABLE_POSITION_ORDER } from '../lib/constants.js';

/**
 * Convierte un valor de fecha (Date o texto ISO) a formato yyyy-mm-dd.
 * @param {Date | string | null | undefined} value
 * @returns {string | null}
 */
const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

/**
 * Serializa una exposición a los campos del contrato (schema Exhibition del
 * openapi): date/endDate como yyyy-mm-dd, sin createdAt/updatedAt.
 * @param {Object} exhibition
 * @returns {Object}
 */
const serializeExhibition = (exhibition) => ({
  id: exhibition.id,
  title: exhibition.title,
  date: toDateString(exhibition.date),
  endDate: toDateString(exhibition.endDate),
  location: exhibition.location,
  description: exhibition.description,
  position: exhibition.position,
  isPublished: exhibition.isPublished,
});

/**
 * HU07 - Crear exposición
 * Endpoint POST /api/v1/admin/exhibitions
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con exposición creada o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, date, endDate, location, description, position, isPublished } = req.body;

    const exhibition = await prisma.exhibition.create({
      data: {
        title,
        date: new Date(date),
        ...(endDate !== undefined && endDate !== null && { endDate: new Date(endDate) }),
        location: location || null,
        description: description || null,
        ...(position !== undefined && { position }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    logger.info('Exposición creada', { id: exhibition.id, title: exhibition.title });

    return sendSuccess(res, serializeExhibition(exhibition), 201);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al crear exposición', error);
  }
};

/**
 * HU07 - Actualizar exposición
 * Endpoint PUT /api/v1/admin/exhibitions/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con exposición actualizada, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, endDate, location, description, position, isPublished } = req.body;

    const exhibition = await prisma.exhibition.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(position !== undefined && { position }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    logger.info('Exposición actualizada', { id: exhibition.id });

    return sendSuccess(res, serializeExhibition(exhibition));
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Exposición no encontrada');
    return sendInternalError(res, logger, 'Error al actualizar exposición', error);
  }
};

/**
 * HU07 - Eliminar exposición
 * Endpoint DELETE /api/v1/admin/exhibitions/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.exhibition.delete({
      where: { id: parseId(id) },
    });

    logger.info('Exposición eliminada', { id: parseId(id) });

    return sendSuccess(res, { message: 'Exposición eliminada correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Exposición no encontrada');
    return sendInternalError(res, logger, 'Error al eliminar exposición', error);
  }
};

/**
 * HU07 - Reordenar exposiciones
 * Endpoint PUT /api/v1/admin/exhibitions/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.exhibition, orderedIds);

    logger.info('Exposiciones reordenadas', { count: orderedIds.length });

    return sendSuccess(res, { message: 'Orden actualizado correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Uno o más IDs no existen');
    }
    return sendInternalError(res, logger, 'Error al reordenar exposiciones', error);
  }
};

/**
 * HU05 - Listar exposiciones publicadas
 * Endpoint GET /api/v1/exhibitions
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con exposiciones publicadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listPublished = async (req, res) => {
  try {
    const exhibitions = await prisma.exhibition.findMany({
      where: { isPublished: true },
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, exhibitions.map(serializeExhibition));
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar exposiciones', error);
  }
};

/**
 * HU07 - Listar todas las exposiciones (admin)
 * Endpoint GET /api/v1/admin/exhibitions
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con todas las exposiciones o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = async (req, res) => {
  try {
    const exhibitions = await prisma.exhibition.findMany({
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, exhibitions.map(serializeExhibition));
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar exposiciones', error);
  }
};

export { create, update, remove, reorder, listPublished, listAll };

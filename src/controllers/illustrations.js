/**
 * @fileoverview Controlador de ilustraciones.
 *
 * Implementa los handlers públicos (HU09) y de administración
 * (HU10) para la galería de ilustraciones.
 *
 * @module controllers/illustrations
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/http-response
 * @requires services/upload
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { resolveImageUrl } from '../services/upload.js';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from '../lib/prisma-utils.js';
import { sendSuccess, sendError, sendNotFound, sendDuplicate, sendInternalError } from '../lib/http-response.js';
import { STABLE_POSITION_ORDER } from '../lib/constants.js';

/**
 * HU10 - Crear ilustración
 * Endpoint POST /api/v1/admin/illustrations
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con ilustración creada, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, description, imageUrl, isPublished, isFeatured } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'ilustracion');

    if (!finalImageUrl) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen es obligatoria (archivo o URL)');
    }

    const illustration = await prisma.illustration.create({
      data: {
        title,
        description: description || null,
        imageUrl: finalImageUrl,
        ...(isPublished !== undefined && { isPublished }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    logger.info('Ilustración creada', { id: illustration.id, title: illustration.title });

    return sendSuccess(res, illustration, 201);
  } catch (error) {
    if (isDuplicateError(error)) {
      return sendDuplicate(res, 'Ya existe una ilustración con ese título');
    }
    return sendInternalError(res, logger, 'Error al crear ilustración', error);
  }
};

/**
 * HU10 - Actualizar ilustración
 * Endpoint PUT /api/v1/admin/illustrations/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con ilustración actualizada, 404, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, isPublished, isFeatured } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'ilustracion');

    const illustration = await prisma.illustration.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    logger.info('Ilustración actualizada', { id: illustration.id });

    return sendSuccess(res, illustration);
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Ilustración no encontrada');
    if (isDuplicateError(error)) return sendDuplicate(res, 'Ya existe una ilustración con ese título');
    return sendInternalError(res, logger, 'Error al actualizar ilustración', error);
  }
};

/**
 * HU10 - Eliminar ilustración
 * Endpoint DELETE /api/v1/admin/illustrations/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.illustration.delete({
      where: { id: parseId(id) },
    });

    logger.info('Ilustración eliminada', { id: parseId(id) });

    return sendSuccess(res, { message: 'Ilustración eliminada correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Ilustración no encontrada');
    return sendInternalError(res, logger, 'Error al eliminar ilustración', error);
  }
};

/**
 * HU09 - Galería Ilustración
 * Endpoint GET /api/v1/illustrations
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con ilustraciones publicadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listPublished = async (req, res) => {
  try {
    const illustrations = await prisma.illustration.findMany({
      where: { isPublished: true },
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, illustrations);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar ilustraciones', error);
  }
};

/**
 * HU10 - Listar todas las ilustraciones (admin)
 * Endpoint GET /api/v1/admin/illustrations
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con todas las ilustraciones o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = async (req, res) => {
  try {
    const illustrations = await prisma.illustration.findMany({
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, illustrations);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar ilustraciones', error);
  }
};

/**
 * HU10 - Reordenar ilustraciones
 * Endpoint PUT /api/v1/admin/illustrations/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.illustration, orderedIds);

    logger.info('Ilustraciones reordenadas', { count: orderedIds.length });

    return sendSuccess(res, { message: 'Orden actualizado correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Uno o más IDs no existen');
    }
    return sendInternalError(res, logger, 'Error al reordenar ilustraciones', error);
  }
};

/**
 * Listar ilustraciones destacadas y publicadas.
 * Endpoint GET /api/v1/illustrations/featured
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con ilustraciones destacadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listFeatured = async (req, res) => {
  try {
    const illustrations = await prisma.illustration.findMany({
      where: { isFeatured: true, isPublished: true },
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, illustrations);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar ilustraciones destacadas', error);
  }
};

export { create, update, remove, reorder, listPublished, listAll, listFeatured };

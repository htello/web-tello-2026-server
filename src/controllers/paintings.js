/**
 * @fileoverview Controlador de pinturas.
 *
 * Implementa los handlers públicos (HU03, HU04) y de administración
 * (HU06) para la galería de pinturas.
 *
 * @module controllers/paintings
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

/**
 * HU06 - Crear pintura
 * Endpoint POST /api/v1/admin/paintings
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con pintura creada, 400, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, imageUrl, collectionId, dimensions, technique, year } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'pintura');

    if (!finalImageUrl) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen es obligatoria (archivo o URL)');
    }

    const collection = await prisma.collection.findUnique({
      where: { id: parseId(collectionId) },
    });

    if (!collection) {
      return sendNotFound(res, 'La colección no existe');
    }

    const painting = await prisma.painting.create({
      data: {
        title,
        imageUrl: finalImageUrl,
        collectionId: parseId(collectionId),
        dimensions: dimensions || null,
        technique: technique || null,
        year: year || null,
      },
    });

    logger.info('Pintura creada', { id: painting.id, title: painting.title });

    return sendSuccess(res, painting, 201);
  } catch (error) {
    if (isDuplicateError(error)) {
      return sendDuplicate(res, 'Ya existe una pintura con ese título en esta colección');
    }
    return sendInternalError(res, logger, 'Error al crear pintura', error);
  }
};

/**
 * HU06 - Actualizar pintura
 * Endpoint PUT /api/v1/admin/paintings/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con pintura actualizada, 404, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, collectionId, dimensions, technique, year } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'pintura');

    const painting = await prisma.painting.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
        ...(collectionId !== undefined && { collectionId: parseId(collectionId) }),
        ...(dimensions !== undefined && { dimensions }),
        ...(technique !== undefined && { technique }),
        ...(year !== undefined && { year }),
      },
    });

    logger.info('Pintura actualizada', { id: painting.id });

    return sendSuccess(res, painting);
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Pintura no encontrada');
    if (isDuplicateError(error)) return sendDuplicate(res, 'Ya existe una pintura con ese título en esta colección');
    return sendInternalError(res, logger, 'Error al actualizar pintura', error);
  }
};

/**
 * HU06 - Eliminar pintura
 * Endpoint DELETE /api/v1/admin/paintings/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.painting.delete({
      where: { id: parseId(id) },
    });

    logger.info('Pintura eliminada', { id: parseId(id) });

    return sendSuccess(res, { message: 'Pintura eliminada correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Pintura no encontrada');
    return sendInternalError(res, logger, 'Error al eliminar pintura', error);
  }
};

/**
 * HU06 - Toggle destacada
 * Endpoint PUT /api/v1/admin/paintings/:id/feature
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con estado actualizado, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const feature = async (req, res) => {
  try {
    const { id } = req.params;

    const painting = await prisma.painting.findUnique({
      where: { id: parseId(id) },
    });

    if (!painting) return sendNotFound(res, 'Pintura no encontrada');

    const updated = await prisma.painting.update({
      where: { id: parseId(id) },
      data: { isFeatured: !painting.isFeatured },
    });

    logger.info('Pintura feature actualizada', { id: updated.id, isFeatured: updated.isFeatured });

    return sendSuccess(res, { isFeatured: updated.isFeatured });
  } catch (error) {
    return sendInternalError(res, logger, 'Error al actualizar feature', error);
  }
};

/**
 * HU06 - Toggle publicación
 * Endpoint PUT /api/v1/admin/paintings/:id/publish
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con estado actualizado, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const publish = async (req, res) => {
  try {
    const { id } = req.params;

    const painting = await prisma.painting.findUnique({
      where: { id: parseId(id) },
    });

    if (!painting) return sendNotFound(res, 'Pintura no encontrada');

    const updated = await prisma.painting.update({
      where: { id: parseId(id) },
      data: { isPublished: !painting.isPublished },
    });

    logger.info('Pintura publish actualizada', { id: updated.id, isPublished: updated.isPublished });

    return sendSuccess(res, { isPublished: updated.isPublished });
  } catch (error) {
    return sendInternalError(res, logger, 'Error al actualizar publish', error);
  }
};

/**
 * HU06 - Reordenar pinturas dentro de colección
 * Endpoint PUT /api/v1/admin/paintings/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.painting, orderedIds);

    logger.info('Pinturas reordenadas', { count: orderedIds.length });

    return sendSuccess(res, { message: 'Orden actualizado correctamente' });
  } catch (error) {
    return sendInternalError(res, logger, 'Error al reordenar pinturas', error);
  }
};

/**
 * HU03 - Ficha de pintura
 * Endpoint GET /api/v1/paintings/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con pintura, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const painting = await prisma.painting.findUnique({
      where: { id: parseId(id) },
      include: { collection: { select: { id: true, title: true } } },
    });

    if (!painting) return sendNotFound(res, 'Pintura no encontrada');

    return sendSuccess(res, painting);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener pintura', error);
  }
};

/**
 * HU04 - Obras destacadas
 * Endpoint GET /api/v1/paintings/featured
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con pinturas destacadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const getFeatured = async (req, res) => {
  try {
    const paintings = await prisma.painting.findMany({
      where: { isFeatured: true, isPublished: true },
      include: { collection: { select: { id: true, title: true } } },
    });

    return sendSuccess(res, paintings);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener pinturas destacadas', error);
  }
};

export { create, update, remove, feature, publish, reorder, getById, getFeatured };

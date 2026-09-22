/**
 * @fileoverview Controlador de colecciones.
 *
 * Implementa los handlers públicos (HU01, HU02) y de administración
 * (HU06) para la galería de colecciones.
 *
 * @module controllers/collections
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/http-response
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from '../lib/prisma-utils.js';
import { sendSuccess, sendError, sendNotFound, sendDuplicate, sendInternalError } from '../lib/http-response.js';

/**
 * HU01 - Listar colecciones publicadas
 * Endpoint GET /api/v1/collections
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con colecciones publicadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listPublished = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { isPublished: true },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { paintings: { where: { isPublished: true } } } },
      },
    });

    const data = collections.map(({ _count, ...collection }) => ({
      ...collection,
      paintingsCount: _count.paintings,
    }));

    return sendSuccess(res, data);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar colecciones publicadas', error);
  }
};

/**
 * HU06 - Listar todas las colecciones (admin)
 * Endpoint GET /api/v1/admin/collections
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con todas las colecciones o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { paintings: true } },
      },
    });

    const data = collections.map(({ _count, ...collection }) => ({
      ...collection,
      paintingsCount: _count.paintings,
    }));

    return sendSuccess(res, data);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar colecciones', error);
  }
};

/**
 * HU06 - Crear colección
 * Endpoint POST /api/v1/admin/collections
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con colección creada, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, description, coverImage, position, isPublished } = req.body;

    const collection = await prisma.collection.create({
      data: {
        title,
        description: description || null,
        coverImage: coverImage || null,
        ...(position !== undefined && { position }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    logger.info('Colección creada', { id: collection.id, title: collection.title });

    return sendSuccess(res, collection, 201);
  } catch (error) {
    if (isDuplicateError(error)) {
      return sendDuplicate(res, 'Ya existe una colección con ese título');
    }
    return sendInternalError(res, logger, 'Error al crear colección', error);
  }
};

/**
 * HU06 - Actualizar colección
 * Endpoint PUT /api/v1/admin/collections/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con colección actualizada, 404, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage, position, isPublished } = req.body;

    const collection = await prisma.collection.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(position !== undefined && { position }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    logger.info('Colección actualizada', { id: collection.id });

    return sendSuccess(res, collection);
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Colección no encontrada');
    if (isDuplicateError(error)) return sendDuplicate(res, 'Ya existe una colección con ese título');
    return sendInternalError(res, logger, 'Error al actualizar colección', error);
  }
};

/**
 * HU06 - Eliminar colección
 * Endpoint DELETE /api/v1/admin/collections/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.collection.delete({
      where: { id: parseId(id) },
    });

    logger.info('Colección eliminada', { id: parseId(id) });

    return sendSuccess(res, { message: 'Colección eliminada correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Colección no encontrada');
    return sendInternalError(res, logger, 'Error al eliminar colección', error);
  }
};

/**
 * HU06 - Reordenar colecciones
 * Endpoint PUT /api/v1/admin/collections/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.collection, orderedIds);

    logger.info('Colecciones reordenadas', { count: orderedIds.length });

    return sendSuccess(res, { message: 'Orden actualizado correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Uno o más IDs no existen');
    }
    return sendInternalError(res, logger, 'Error al reordenar colecciones', error);
  }
};

/**
 * HU02 - Detalle de colección
 * Endpoint GET /api/v1/collections/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con colección, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id: parseId(id) },
      include: {
        paintings: { orderBy: { position: 'asc' } },
      },
    });

    if (!collection) return sendNotFound(res, 'Colección no encontrada');

    return sendSuccess(res, collection);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener colección', error);
  }
};

export { listPublished, listAll, getById, create, update, remove, reorder };

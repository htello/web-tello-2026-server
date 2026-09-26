/**
 * @fileoverview Controlador de ilustraciones.
 *
 * Implementa los handlers públicos (HU09) y de administración
 * (HU10) para la galería de ilustraciones, apoyándose en las
 * factorías compartidas de `lib/crud-factory`.
 *
 * @module controllers/illustrations
 * @requires lib/prisma
 * @requires lib/crud-factory
 * @requires lib/paginated-list
 * @requires lib/constants
 */

import prisma from '../lib/prisma.js';
import { createPaginatedListHandler } from '../lib/paginated-list.js';
import {
  createReorderHandler,
  createFindManyHandler,
  createImageResourceHandlers,
  imagePublicIdField,
} from '../lib/crud-factory.js';
import { STABLE_POSITION_ORDER } from '../lib/constants.js';

const { create, update, remove } = createImageResourceHandlers({
  model: prisma.illustration,
  section: 'ilustracion',
  buildCreateData: ({ body, imageAsset, finalImageUrl }) => ({
    title: body.title,
    description: body.description || null,
    imageUrl: finalImageUrl,
    ...imagePublicIdField(imageAsset, finalImageUrl),
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  }),
  buildUpdateData: ({ body, imageAsset, finalImageUrl }) => ({
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
    ...(finalImageUrl ? imagePublicIdField(imageAsset, finalImageUrl) : {}),
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  }),
  labels: {
    created: 'Ilustración creada',
    updated: 'Ilustración actualizada',
    removed: 'Ilustración eliminada',
    notFound: 'Ilustración no encontrada',
    removedMessage: 'Ilustración eliminada correctamente',
    duplicate: 'Ya existe una ilustración con ese título',
    createError: 'Error al crear ilustración',
    updateError: 'Error al actualizar ilustración',
    removeError: 'Error al eliminar ilustración',
  },
});

/**
 * HU09 - Galería Ilustración
 * Endpoint GET /api/v1/illustrations
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con ilustraciones publicadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listPublished = createFindManyHandler({
  model: prisma.illustration,
  args: {
    where: { isPublished: true },
    orderBy: STABLE_POSITION_ORDER,
  },
  errorMessage: 'Error al listar ilustraciones',
});

/**
 * HU10 - Listar todas las ilustraciones (admin)
 * Endpoint GET /api/v1/admin/illustrations
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.query.page - Número de página (default 1)
 * @param {Object} req.query.limit - Elementos por página (default 20, max 100)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con data paginada y meta, o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = createPaginatedListHandler({
  model: prisma.illustration,
  findManyArgs: {
    orderBy: STABLE_POSITION_ORDER,
  },
  errorMessage: 'Error al listar ilustraciones',
});

/**
 * HU10 - Reordenar ilustraciones
 * Endpoint PUT /api/v1/admin/illustrations/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = createReorderHandler({
  model: prisma.illustration,
  logLabel: 'Ilustraciones reordenadas',
  errorMessage: 'Error al reordenar ilustraciones',
});

/**
 * Listar ilustraciones destacadas y publicadas.
 * Endpoint GET /api/v1/illustrations/featured
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con ilustraciones destacadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listFeatured = createFindManyHandler({
  model: prisma.illustration,
  args: {
    where: { isFeatured: true, isPublished: true },
    orderBy: STABLE_POSITION_ORDER,
  },
  errorMessage: 'Error al listar ilustraciones destacadas',
});

export { create, update, remove, reorder, listPublished, listAll, listFeatured };

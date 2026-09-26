/**
 * @fileoverview Controlador de pinturas.
 *
 * Implementa los handlers públicos (HU03, HU04) y de administración
 * (HU06) para la galería de pinturas, apoyándose en las factorías
 * compartidas de `lib/crud-factory`.
 *
 * @module controllers/paintings
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/crud-factory
 * @requires lib/http-response
 * @requires lib/constants
 */

import prisma from '../lib/prisma.js';
import { parseId } from '../lib/prisma-utils.js';
import { sendNotFound } from '../lib/http-response.js';
import { createPaginatedListHandler } from '../lib/paginated-list.js';
import {
  createReorderHandler,
  createFindManyHandler,
  createGetByIdHandler,
  createImageResourceHandlers,
  imagePublicIdField,
} from '../lib/crud-factory.js';
import { STABLE_POSITION_ORDER } from '../lib/constants.js';

/** Include de la colección asociada, recortado a id y title. */
const COLLECTION_INCLUDE = { collection: { select: { id: true, title: true } } };

/**
 * Construye el filtro `where` del listado admin según la query.
 *
 * @param {Object} query - Query del request (req.query)
 * @param {string} [query.collectionId] - Filtra por colección (entero positivo)
 * @returns {Object|string} Objeto `where` (o `{}`) o mensaje de error de validación
 */
const buildListWhere = ({ collectionId } = {}) => {
  if (collectionId === undefined || collectionId === '') return {};
  const id = Number.parseInt(collectionId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return 'El collectionId debe ser un entero positivo';
  }
  return { collectionId: id };
};

/**
 * HU06 - Crear/actualizar/eliminar pintura (factory de recursos con imagen)
 * Endpoints POST/PUT/DELETE /api/v1/admin/paintings[/:id]
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const { create, update, remove } = createImageResourceHandlers({
  model: prisma.painting,
  section: 'pintura',
  validateCreate: async ({ req, res }) => {
    const collection = await prisma.collection.findUnique({
      where: { id: parseId(req.body.collectionId) },
    });

    return collection ? null : sendNotFound(res, 'La colección no existe');
  },
  buildCreateData: ({ body, imageAsset, finalImageUrl }) => ({
    title: body.title,
    imageUrl: finalImageUrl,
    ...imagePublicIdField(imageAsset, finalImageUrl),
    collectionId: parseId(body.collectionId),
    dimensions: body.dimensions || null,
    technique: body.technique || null,
    year: body.year || null,
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  }),
  buildUpdateData: ({ body, imageAsset, finalImageUrl }) => ({
    ...(body.title !== undefined && { title: body.title }),
    ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
    ...(finalImageUrl ? imagePublicIdField(imageAsset, finalImageUrl) : {}),
    ...(body.collectionId !== undefined && { collectionId: parseId(body.collectionId) }),
    ...(body.dimensions !== undefined && { dimensions: body.dimensions }),
    ...(body.technique !== undefined && { technique: body.technique }),
    ...(body.year !== undefined && { year: body.year }),
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  }),
  labels: {
    created: 'Pintura creada',
    updated: 'Pintura actualizada',
    removed: 'Pintura eliminada',
    notFound: 'Pintura no encontrada',
    removedMessage: 'Pintura eliminada correctamente',
    duplicate: 'Ya existe una pintura con ese título en esta colección',
    createError: 'Error al crear pintura',
    updateError: 'Error al actualizar pintura',
    removeError: 'Error al eliminar pintura',
  },
});

/**
 * HU06 - Listar todas las pinturas (admin)
 * Endpoint GET /api/v1/admin/paintings
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.query.page - Número de página (default 1)
 * @param {Object} req.query.limit - Elementos por página (default 20, max 100)
 * @param {Object} req.query.collectionId - Filtro opcional por colección
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con data paginada y meta, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = createPaginatedListHandler({
  model: prisma.painting,
  findManyArgs: {
    orderBy: STABLE_POSITION_ORDER,
    include: COLLECTION_INCLUDE,
  },
  buildWhere: buildListWhere,
  errorMessage: 'Error al listar pinturas',
});

/**
 * HU06 - Reordenar pinturas dentro de colección
 * Endpoint PUT /api/v1/admin/paintings/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = createReorderHandler({
  model: prisma.painting,
  logLabel: 'Pinturas reordenadas',
  errorMessage: 'Error al reordenar pinturas',
});

/**
 * HU03 - Ficha de pintura
 * Endpoint GET /api/v1/paintings/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con pintura, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const getById = createGetByIdHandler({
  model: prisma.painting,
  args: { include: COLLECTION_INCLUDE },
  notFoundMessage: 'Pintura no encontrada',
  errorMessage: 'Error al obtener pintura',
});

/**
 * HU04 - Obras destacadas
 * Endpoint GET /api/v1/paintings/featured
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con pinturas destacadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const getFeatured = createFindManyHandler({
  model: prisma.painting,
  args: {
    where: { isFeatured: true, isPublished: true },
    orderBy: STABLE_POSITION_ORDER,
    include: COLLECTION_INCLUDE,
  },
  errorMessage: 'Error al obtener pinturas destacadas',
});

/**
 * Listar todas las pinturas publicadas
 * Endpoint GET /api/v1/paintings
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con pinturas publicadas o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listPublished = createFindManyHandler({
  model: prisma.painting,
  args: {
    where: { isPublished: true },
    orderBy: STABLE_POSITION_ORDER,
    include: COLLECTION_INCLUDE,
  },
  errorMessage: 'Error al listar pinturas',
});

export { create, update, remove, reorder, getById, getFeatured, listPublished, listAll };

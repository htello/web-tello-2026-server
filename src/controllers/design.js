/**
 * @fileoverview Controlador de proyectos de diseño.
 *
 * Implementa los handlers públicos (HU08) y de administración
 * (HU10) para la sección de diseño e ilustración, apoyándose en
 * las factorías compartidas de `lib/crud-factory`.
 *
 * @module controllers/design
 * @requires lib/prisma
 * @requires lib/crud-factory
 * @requires lib/paginated-list
 * @requires lib/http-response
 * @requires lib/constants
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { sendSuccess, sendNotFound, sendValidationError, sendInternalError } from '../lib/http-response.js';
import { createPaginatedListHandler } from '../lib/paginated-list.js';
import {
  createReorderHandler,
  createFindManyHandler,
  createImageResourceHandlers,
  imagePublicIdField,
} from '../lib/crud-factory.js';
import { DESIGN_SUBCATEGORIES, STABLE_POSITION_ORDER } from '../lib/constants.js';

const { create, update, remove } = createImageResourceHandlers({
  model: prisma.designProject,
  section: 'diseno',
  buildCreateData: ({ body, imageAsset, finalImageUrl }) => ({
    title: body.title,
    description: body.description || null,
    imageUrl: finalImageUrl,
    ...imagePublicIdField(imageAsset, finalImageUrl),
    subcategory: body.subcategory,
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  }),
  buildUpdateData: ({ body, imageAsset, finalImageUrl }) => ({
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
    ...(finalImageUrl ? imagePublicIdField(imageAsset, finalImageUrl) : {}),
    ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  }),
  labels: {
    created: 'Proyecto de diseño creado',
    updated: 'Proyecto de diseño actualizado',
    removed: 'Proyecto de diseño eliminado',
    notFound: 'Proyecto de diseño no encontrado',
    removedMessage: 'Proyecto de diseño eliminado correctamente',
    duplicate: 'Ya existe un proyecto de diseño con ese título',
    createError: 'Error al crear proyecto de diseño',
    updateError: 'Error al actualizar proyecto de diseño',
    removeError: 'Error al eliminar proyecto de diseño',
  },
});

/**
 * Construye el filtro `where` del listado admin según la query.
 *
 * @param {Object} query - Query del request (req.query)
 * @param {string} [query.subcategory] - Filtra por subcategoría válida
 * @returns {Object|string} Objeto `where` (o `{}`) o mensaje de error de validación
 */
const buildListWhere = ({ subcategory } = {}) => {
  if (subcategory === undefined || subcategory === '') return {};
  if (!DESIGN_SUBCATEGORIES.includes(subcategory)) {
    return `La subcategoría debe ser: ${DESIGN_SUBCATEGORIES.join(', ')}`;
  }
  return { subcategory };
};

/**
 * HU10 - Listar todos los proyectos de diseño (admin)
 * Endpoint GET /api/v1/admin/design
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.query.page - Número de página (default 1)
 * @param {Object} req.query.limit - Elementos por página (default 20, max 100)
 * @param {Object} req.query.subcategory - Filtro opcional por subcategoría
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con data paginada y meta, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = createPaginatedListHandler({
  model: prisma.designProject,
  findManyArgs: {
    orderBy: STABLE_POSITION_ORDER,
  },
  buildWhere: buildListWhere,
  errorMessage: 'Error al listar proyectos de diseño',
});

/**
 * HU10 - Reordenar proyectos de diseño
 * Endpoint PUT /api/v1/admin/design/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = createReorderHandler({
  model: prisma.designProject,
  logLabel: 'Proyectos de diseño reordenados',
  errorMessage: 'Error al reordenar proyectos de diseño',
});

/**
 * HU08 - Filtrar Diseño
 * Endpoint GET /api/v1/design
 *
 * Lista proyectos publicados filtrando obligatoriamente por subcategoría.
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con proyectos, 400, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listFiltered = async (req, res) => {
  try {
    const { subcategory } = req.query;

    if (!subcategory) {
      return sendValidationError(res, 'La subcategoría es obligatoria');
    }

    if (!DESIGN_SUBCATEGORIES.includes(subcategory)) {
      return sendNotFound(res, 'Subcategoría inválida');
    }

    const projects = await prisma.designProject.findMany({
      where: { subcategory, isPublished: true },
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, projects);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar proyectos de diseño', error);
  }
};

/**
 * Listar proyectos de diseño destacados y publicados.
 * Endpoint GET /api/v1/design/featured
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con proyectos destacados o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listFeatured = createFindManyHandler({
  model: prisma.designProject,
  args: {
    where: { isFeatured: true, isPublished: true },
    orderBy: STABLE_POSITION_ORDER,
  },
  errorMessage: 'Error al listar proyectos de diseño destacados',
});

export { create, update, remove, reorder, listAll, listFiltered, listFeatured };

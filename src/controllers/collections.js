/**
 * @fileoverview Controlador de colecciones.
 *
 * Implementa los handlers públicos (HU01, HU02) y de administración
 * (HU06) para la galería de colecciones.
 *
 * @module controllers/collections
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/crud-factory
 * @requires lib/http-response
 * @requires lib/constants
 * @requires services/cloudinary
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { parseId, isNotFoundError, isDuplicateError } from '../lib/prisma-utils.js';
import { sendSuccess, sendNotFound, sendDuplicate, sendInternalError } from '../lib/http-response.js';
import { createPaginatedListHandler } from '../lib/paginated-list.js';
import { createReorderHandler } from '../lib/crud-factory.js';
import { STABLE_POSITION_ORDER } from '../lib/constants.js';
import { deleteCloudinaryImage, extractPublicId } from '../services/cloudinary.js';

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
    // Solo colecciones publicadas que tengan al menos una pintura publicada:
    // las galerías públicas no muestran colecciones vacías.
    const collections = await prisma.collection.findMany({
      where: {
        isPublished: true,
        paintings: { some: { isPublished: true } },
      },
      orderBy: STABLE_POSITION_ORDER,
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
 * @param {Object} req.query.page - Número de página (default 1)
 * @param {Object} req.query.limit - Elementos por página (default 20, max 100)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con data paginada y meta, o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = createPaginatedListHandler({
  model: prisma.collection,
  findManyArgs: {
    orderBy: STABLE_POSITION_ORDER,
    include: {
      _count: { select: { paintings: true } },
    },
  },
  serialize: ({ _count, ...collection }) => ({
    ...collection,
    paintingsCount: _count.paintings,
  }),
  errorMessage: 'Error al listar colecciones',
});

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
    const coverImageId = extractPublicId(coverImage);

    const collection = await prisma.collection.create({
      data: {
        title,
        description: description || null,
        coverImage: coverImage || null,
        ...(coverImageId && { coverImageId }),
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
    const coverImageId = extractPublicId(coverImage);

    if (coverImage) {
      const previousCollection = await prisma.collection.findUnique({
        where: { id: parseId(id) },
        select: { coverImage: true, coverImageId: true },
      });

      if (previousCollection && previousCollection.coverImage !== coverImage) {
        await deleteCloudinaryImage(previousCollection.coverImageId, previousCollection.coverImage);
      }
    }

    const collection = await prisma.collection.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(coverImage && coverImageId && { coverImageId }),
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
    const recordId = parseId(req.params.id);

    const collection = await prisma.collection.findUnique({
      where: { id: recordId },
      include: {
        paintings: { select: { imageUrl: true, imagePublicId: true } },
      },
    });

    if (!collection) {
      return sendNotFound(res, 'Colección no encontrada');
    }

    await deleteCloudinaryImage(collection.coverImageId, collection.coverImage);
    await Promise.all(
      collection.paintings.map((painting) =>
        deleteCloudinaryImage(painting.imagePublicId, painting.imageUrl),
      ),
    );

    await prisma.collection.delete({ where: { id: recordId } });

    logger.info('Colección eliminada', { id: recordId });

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
const reorder = createReorderHandler({
  model: prisma.collection,
  logLabel: 'Colecciones reordenadas',
  errorMessage: 'Error al reordenar colecciones',
});

/**
 * HU02 - Detalle de colección
 * Endpoint GET /api/v1/collections/:id
 *
 * Solo expone colecciones publicadas y, dentro de ellas, las pinturas
 * publicadas, recortadas a los campos del contrato (CollectionDetail /
 * PaintingSummary del openapi).
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con colección, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findFirst({
      where: { id: parseId(id), isPublished: true },
      include: {
        paintings: {
          where: { isPublished: true },
          orderBy: STABLE_POSITION_ORDER,
        },
      },
    });

    if (!collection) return sendNotFound(res, 'Colección no encontrada');

    const data = {
      id: collection.id,
      title: collection.title,
      description: collection.description,
      coverImage: collection.coverImage,
      position: collection.position,
      isPublished: collection.isPublished,
      paintings: collection.paintings.map(
        ({ id: paintingId, title, imageUrl, dimensions, technique, year, isFeatured }) => ({
          id: paintingId,
          title,
          imageUrl,
          dimensions,
          technique,
          year,
          isFeatured,
        }),
      ),
    };

    return sendSuccess(res, data);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener colección', error);
  }
};

export { listPublished, listAll, getById, create, update, remove, reorder };

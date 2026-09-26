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
import { sendSuccess, sendPaginated, sendError, sendNotFound, sendInternalError } from '../lib/http-response.js';
import { parsePagination, buildPaginationMeta } from '../lib/pagination.js';
import { STABLE_POSITION_ORDER } from '../lib/constants.js';
import { deleteCloudinaryImage, extractPublicId } from '../services/cloudinary.js';

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

/** Include reutilizable para cargar las imágenes ordenadas por position. */
const IMAGES_INCLUDE = { images: { orderBy: STABLE_POSITION_ORDER } };

/**
 * Serializa una imagen de exposición a los campos del contrato.
 * @param {Object} image
 * @returns {Object}
 */
const serializeExhibitionImage = ({ id, url, thumbnail, width, height, position }) => ({
  id,
  url,
  thumbnail: thumbnail ?? null,
  width: width ?? null,
  height: height ?? null,
  position,
});

/**
 * Serializa una exposición a los campos del contrato (schema Exhibition del
 * openapi): date/endDate como yyyy-mm-dd, images ordenadas, sin createdAt/updatedAt.
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
  images: (exhibition.images ?? []).map(serializeExhibitionImage),
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
    const { title, date, endDate, location, description, position, isPublished, images } = req.body;

    const exhibition = await prisma.exhibition.create({
      data: {
        title,
        date: new Date(date),
        ...(endDate !== undefined && endDate !== null && { endDate: new Date(endDate) }),
        location: location || null,
        description: description || null,
        ...(position !== undefined && { position }),
        ...(isPublished !== undefined && { isPublished }),
        ...(images !== undefined && {
          images: {
          create: images.map((image, index) => ({
            ...image,
            ...(extractPublicId(image.url) && { publicId: extractPublicId(image.url) }),
            position: index,
          })),
          },
        }),
      },
      include: IMAGES_INCLUDE,
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
    const exhibitionId = parseId(id);
    const { title, date, endDate, location, description, position, isPublished, images } = req.body;

    const data = {
      ...(title !== undefined && { title }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(location !== undefined && { location }),
      ...(description !== undefined && { description }),
      ...(position !== undefined && { position }),
      ...(isPublished !== undefined && { isPublished }),
    };

    let exhibition;
    if (images === undefined) {
      exhibition = await prisma.exhibition.update({
        where: { id: exhibitionId },
        data,
        include: IMAGES_INCLUDE,
      });
    } else {
      const oldImages = await prisma.exhibitionImage.findMany({
        where: { exhibitionId },
        select: { url: true, publicId: true },
      }) || [];

      await Promise.all(
        oldImages.map((image) => deleteCloudinaryImage(image.publicId, image.url)),
      );

      const [, , , reloaded] = await prisma.$transaction([
        prisma.exhibition.update({ where: { id: exhibitionId }, data }),
        prisma.exhibitionImage.deleteMany({ where: { exhibitionId } }),
        prisma.exhibitionImage.createMany({
          data: images.map((image, index) => ({
            ...image,
            ...(extractPublicId(image.url) && { publicId: extractPublicId(image.url) }),
            exhibitionId,
            position: index,
          })),
        }),
        prisma.exhibition.findUnique({ where: { id: exhibitionId }, include: IMAGES_INCLUDE }),
      ]);
      exhibition = reloaded;
    }

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

    const exhibition = await prisma.exhibition.findUnique({
      where: { id: parseId(id) },
      include: { images: { select: { url: true, publicId: true } } },
    });

    if (exhibition === null) {
      return sendNotFound(res, 'Exposición no encontrada');
    }

    if (exhibition) {
      await Promise.all(
        exhibition.images.map((image) => deleteCloudinaryImage(image.publicId, image.url)),
      );
    }

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
      include: IMAGES_INCLUDE,
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
 * @param {Object} req.query.page - Número de página (default 1)
 * @param {Object} req.query.limit - Elementos por página (default 20, max 100)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con data paginada y meta, o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [exhibitions, total] = await Promise.all([
      prisma.exhibition.findMany({
        skip,
        take: limit,
        orderBy: STABLE_POSITION_ORDER,
        include: IMAGES_INCLUDE,
      }),
      prisma.exhibition.count(),
    ]);

    return sendPaginated(res, exhibitions.map(serializeExhibition), buildPaginationMeta(total, page, limit));
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar exposiciones', error);
  }
};

export { create, update, remove, reorder, listPublished, listAll };

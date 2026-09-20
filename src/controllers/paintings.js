import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { resolveImageUrl } from '../services/upload.js';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from '../lib/prisma-utils.js';

/**
 * HU06 - Crear pintura
 * Endpoint POST /api/v1/admin/paintings
 *
 * @param {Object} req.body.title - Título de la pintura (requerido)
 * @param {Object} req.body.imageUrl - URL de la imagen (requerido si no hay file)
 * @param {Object} req.body.collectionId - ID de la colección (requerido)
 * @param {Object} [req.file] - Archivo de imagen (opcional, alternativa a imageUrl)
 * @param {Object} [req.body.dimensions] - Dimensiones
 * @param {Object} [req.body.technique] - Técnica
 * @param {Object} [req.body.year] - Año
 * @returns {Object} 201 - Pintura creada
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, imageUrl, collectionId, dimensions, technique, year } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'pintura');

    if (!finalImageUrl) {
      return res.status(400).json({
        error: 'La imagen es obligatoria (archivo o URL)',
        code: 'VALIDATION_ERROR',
      });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: parseId(collectionId) },
    });

    if (!collection) {
      return res.status(404).json({
        error: 'La colección no existe',
        code: 'NOT_FOUND',
      });
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

    res.status(201).json({ data: painting });
  } catch (error) {
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe una pintura con ese título en esta colección',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al crear pintura', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Actualizar pintura
 * Endpoint PUT /api/v1/admin/paintings/:id
 *
 * @param {string} req.params.id - ID de la pintura
 * @returns {Object} 200 - Pintura actualizada
 * @returns {Object} 404 - Pintura no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
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

    res.status(200).json({ data: painting });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Pintura no encontrada',
        code: 'NOT_FOUND',
      });
    }
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe una pintura con ese título en esta colección',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al actualizar pintura', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Eliminar pintura
 * Endpoint DELETE /api/v1/admin/paintings/:id
 *
 * @param {string} req.params.id - ID de la pintura
 * @returns {Object} 200 - Confirmación de eliminación
 * @returns {Object} 404 - Pintura no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.painting.delete({
      where: { id: parseId(id) },
    });

    logger.info('Pintura eliminada', { id: parseId(id) });

    res.status(200).json({
      data: { message: 'Pintura eliminada correctamente' },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Pintura no encontrada',
        code: 'NOT_FOUND',
      });
    }
    logger.error('Error al eliminar pintura', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Toggle destacada
 * Endpoint PUT /api/v1/admin/paintings/:id/feature
 *
 * @param {string} req.params.id - ID de la pintura
 * @returns {Object} 200 - Estado de destacado actualizado
 * @returns {Object} 404 - Pintura no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const feature = async (req, res) => {
  try {
    const { id } = req.params;

    const painting = await prisma.painting.findUnique({
      where: { id: parseId(id) },
    });

    if (!painting) {
      return res.status(404).json({
        error: 'Pintura no encontrada',
        code: 'NOT_FOUND',
      });
    }

    const updated = await prisma.painting.update({
      where: { id: parseId(id) },
      data: { isFeatured: !painting.isFeatured },
    });

    logger.info('Pintura feature actualizada', { id: updated.id, isFeatured: updated.isFeatured });

    res.status(200).json({ data: { isFeatured: updated.isFeatured } });
  } catch (error) {
    logger.error('Error al actualizar feature', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Toggle publicación
 * Endpoint PUT /api/v1/admin/paintings/:id/publish
 *
 * @param {string} req.params.id - ID de la pintura
 * @returns {Object} 200 - Estado de publicación actualizado
 * @returns {Object} 404 - Pintura no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const publish = async (req, res) => {
  try {
    const { id } = req.params;

    const painting = await prisma.painting.findUnique({
      where: { id: parseId(id) },
    });

    if (!painting) {
      return res.status(404).json({
        error: 'Pintura no encontrada',
        code: 'NOT_FOUND',
      });
    }

    const updated = await prisma.painting.update({
      where: { id: parseId(id) },
      data: { isPublished: !painting.isPublished },
    });

    logger.info('Pintura publish actualizada', { id: updated.id, isPublished: updated.isPublished });

    res.status(200).json({ data: { isPublished: updated.isPublished } });
  } catch (error) {
    logger.error('Error al actualizar publish', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Reordenar pinturas dentro de colección
 * Endpoint PUT /api/v1/admin/paintings/reorder
 *
 * @param {number[]} req.body.orderedIds - Array de IDs en el orden deseado
 * @param {number} req.body.collectionId - ID de la colección
 * @returns {Object} 200 - Confirmación de reordenamiento
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.painting, orderedIds);

    logger.info('Pinturas reordenadas', { count: orderedIds.length });

    res.status(200).json({
      data: { message: 'Orden actualizado correctamente' },
    });
  } catch (error) {
    logger.error('Error al reordenar pinturas', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU03 - Ficha de pintura
 * Endpoint GET /api/v1/paintings/:id
 *
 * Retorna una pintura con su colección asociada.
 *
 * @param {string} req.params.id - ID de la pintura
 * @returns {Object} 200 - { data: { id, title, imageUrl, collection: { id, title } } }
 * @returns {Object} 404 - Pintura no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Endpoint público (no requiere autenticación)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const painting = await prisma.painting.findUnique({
      where: { id: parseId(id) },
      include: { collection: { select: { id: true, title: true } } },
    });

    if (!painting) {
      return res.status(404).json({
        error: 'Pintura no encontrada',
        code: 'NOT_FOUND',
      });
    }

    res.status(200).json({ data: painting });
  } catch (error) {
    logger.error('Error al obtener pintura', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU04 - Obras destacadas
 * Endpoint GET /api/v1/paintings/featured
 *
 * Retorna las pinturas destacadas y publicadas, incluyendo su colección.
 *
 * @returns {Object} 200 - { data: [{ id, title, imageUrl, collection: { id, title } }] }
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Endpoint público (no requiere autenticación)
 */
const getFeatured = async (req, res) => {
  try {
    const paintings = await prisma.painting.findMany({
      where: { isFeatured: true, isPublished: true },
      include: { collection: { select: { id: true, title: true } } },
    });

    res.status(200).json({ data: paintings });
  } catch (error) {
    logger.error('Error al obtener pinturas destacadas', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { create, update, remove, feature, publish, reorder, getById, getFeatured };

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from '../lib/prisma-utils.js';

/**
 * HU01 - Listar colecciones publicadas
 * Endpoint GET /api/v1/collections
 *
 * Retorna únicamente las colecciones publicadas, ordenadas por posición,
 * incluyendo el conteo de pinturas publicadas de cada una.
 *
 * @returns {Object} 200 - { data: [{ id, title, coverImage, paintingsCount, ... }] }
 * @returns {Object} 500 - Error interno del servidor
 *
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

    res.status(200).json({ data });
  } catch (error) {
    logger.error('Error al listar colecciones publicadas', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Crear colección
 * Endpoint POST /api/v1/admin/collections
 *
 * @param {Object} req.body.title - Título de la colección (requerido)
 * @param {Object} [req.body.description] - Descripción (opcional)
 * @param {Object} [req.body.coverImage] - URL de imagen de portada (opcional)
 * @returns {Object} 201 - Colección creada
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, description, coverImage } = req.body;

    const collection = await prisma.collection.create({
      data: {
        title,
        description: description || null,
        coverImage: coverImage || null,
      },
    });

    logger.info('Colección creada', { id: collection.id, title: collection.title });

    res.status(201).json({ data: collection });
  } catch (error) {
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe una colección con ese título',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al crear colección', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Actualizar colección
 * Endpoint PUT /api/v1/admin/collections/:id
 *
 * @param {string} req.params.id - ID de la colección
 * @param {Object} [req.body.title] - Título
 * @param {Object} [req.body.description] - Descripción
 * @param {Object} [req.body.coverImage] - URL de imagen
 * @returns {Object} 200 - Colección actualizada
 * @returns {Object} 404 - Colección no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage } = req.body;

    const collection = await prisma.collection.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

    logger.info('Colección actualizada', { id: collection.id });

    res.status(200).json({ data: collection });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Colección no encontrada',
        code: 'NOT_FOUND',
      });
    }
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe una colección con ese título',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al actualizar colección', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Eliminar colección
 * Endpoint DELETE /api/v1/admin/collections/:id
 *
 * @param {string} req.params.id - ID de la colección
 * @returns {Object} 200 - Confirmación de eliminación
 * @returns {Object} 404 - Colección no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.collection.delete({
      where: { id: parseId(id) },
    });

    logger.info('Colección eliminada', { id: parseId(id) });

    res.status(200).json({
      data: { message: 'Colección eliminada correctamente' },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Colección no encontrada',
        code: 'NOT_FOUND',
      });
    }
    logger.error('Error al eliminar colección', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU06 - Reordenar colecciones
 * Endpoint PUT /api/v1/admin/collections/reorder
 *
 * @param {number[]} req.body.orderedIds - Array de IDs en el orden deseado
 * @returns {Object} 200 - Confirmación de reordenamiento
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.collection, orderedIds);

    logger.info('Colecciones reordenadas', { count: orderedIds.length });

    res.status(200).json({
      data: { message: 'Orden actualizado correctamente' },
    });
  } catch (error) {
    logger.error('Error al reordenar colecciones', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU02 - Detalle de colección
 * Endpoint GET /api/v1/collections/:id
 *
 * Retorna una colección con sus pinturas ordenadas por posición.
 *
 * @param {string} req.params.id - ID de la colección
 * @returns {Object} 200 - { data: { id, title, paintings: [...] } }
 * @returns {Object} 404 - Colección no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
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

    if (!collection) {
      return res.status(404).json({
        error: 'Colección no encontrada',
        code: 'NOT_FOUND',
      });
    }

    res.status(200).json({ data: collection });
  } catch (error) {
    logger.error('Error al obtener colección', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { listPublished, getById, create, update, remove, reorder };

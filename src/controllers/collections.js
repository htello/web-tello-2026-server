import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';

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
    if (error.message.includes('Unique constraint failed')) {
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
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

    logger.info('Colección actualizada', { id: collection.id });

    res.status(200).json({ data: collection });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Colección no encontrada',
        code: 'NOT_FOUND',
      });
    }
    if (error.message.includes('Unique constraint failed')) {
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
      where: { id: parseInt(id) },
    });

    logger.info('Colección eliminada', { id: parseInt(id) });

    res.status(200).json({
      data: { message: 'Colección eliminada correctamente' },
    });
  } catch (error) {
    if (error.code === 'P2025') {
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

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.collection.update({
          where: { id },
          data: { position: index },
        })
      )
    );

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

export { create, update, remove, reorder };

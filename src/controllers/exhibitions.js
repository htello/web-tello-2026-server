import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { parseId, isNotFoundError, reorderByPosition } from '../lib/prisma-utils.js';

const create = async (req, res) => {
  try {
    const { title, date, location, description } = req.body;

    const exhibition = await prisma.exhibition.create({
      data: {
        title,
        date: new Date(date),
        location: location || null,
        description: description || null,
      },
    });

    logger.info('Exposición creada', { id: exhibition.id, title: exhibition.title });

    res.status(201).json({ data: exhibition });
  } catch (error) {
    logger.error('Error al crear exposición', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, description } = req.body;

    const exhibition = await prisma.exhibition.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
      },
    });

    logger.info('Exposición actualizada', { id: exhibition.id });

    res.status(200).json({ data: exhibition });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Exposición no encontrada',
        code: 'NOT_FOUND',
      });
    }
    logger.error('Error al actualizar exposición', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.exhibition.delete({
      where: { id: parseId(id) },
    });

    logger.info('Exposición eliminada', { id: parseId(id) });

    res.status(200).json({
      data: { message: 'Exposición eliminada correctamente' },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Exposición no encontrada',
        code: 'NOT_FOUND',
      });
    }
    logger.error('Error al eliminar exposición', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.exhibition, orderedIds);

    logger.info('Exposiciones reordenadas', { count: orderedIds.length });

    res.status(200).json({
      data: { message: 'Orden actualizado correctamente' },
    });
  } catch (error) {
    logger.error('Error al reordenar exposiciones', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { create, update, remove, reorder };

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';

const get = async (req, res) => {
  try {
    const biography = await prisma.biography.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!biography) {
      return res.status(404).json({
        error: 'Biografía no encontrada',
        code: 'NOT_FOUND',
      });
    }

    res.status(200).json({ data: biography });
  } catch (error) {
    logger.error('Error al obtener biografía', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const createOrUpdate = async (req, res) => {
  try {
    const { content } = req.body;

    const existing = await prisma.biography.findFirst();

    let biography;
    if (existing) {
      biography = await prisma.biography.update({
        where: { id: existing.id },
        data: { content },
      });
      logger.info('Biografía actualizada', { id: biography.id });
    } else {
      biography = await prisma.biography.create({
        data: { content },
      });
      logger.info('Biografía creada', { id: biography.id });
    }

    res.status(200).json({ data: biography });
  } catch (error) {
    logger.error('Error al guardar biografía', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { get, createOrUpdate };

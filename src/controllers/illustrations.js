import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { resolveImageUrl } from '../services/upload.js';
import { parseId, isNotFoundError, isDuplicateError } from '../lib/prisma-utils.js';

const create = async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'ilustracion');

    if (!finalImageUrl) {
      return res.status(400).json({
        error: 'La imagen es obligatoria (archivo o URL)',
        code: 'VALIDATION_ERROR',
      });
    }

    const illustration = await prisma.illustration.create({
      data: {
        title,
        description: description || null,
        imageUrl: finalImageUrl,
      },
    });

    logger.info('Ilustración creada', { id: illustration.id, title: illustration.title });

    res.status(201).json({ data: illustration });
  } catch (error) {
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe una ilustración con ese título',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al crear ilustración', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'ilustracion');

    const illustration = await prisma.illustration.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
      },
    });

    logger.info('Ilustración actualizada', { id: illustration.id });

    res.status(200).json({ data: illustration });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Ilustración no encontrada',
        code: 'NOT_FOUND',
      });
    }
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe una ilustración con ese título',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al actualizar ilustración', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.illustration.delete({
      where: { id: parseId(id) },
    });

    logger.info('Ilustración eliminada', { id: parseId(id) });

    res.status(200).json({
      data: { message: 'Ilustración eliminada correctamente' },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Ilustración no encontrada',
        code: 'NOT_FOUND',
      });
    }
    logger.error('Error al eliminar ilustración', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { create, update, remove };

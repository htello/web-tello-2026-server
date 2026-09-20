import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { resolveImageUrl } from '../services/upload.js';
import { parseId, isNotFoundError, isDuplicateError } from '../lib/prisma-utils.js';
import { DESIGN_SUBCATEGORIES } from '../lib/constants.js';

const create = async (req, res) => {
  try {
    const { title, description, imageUrl, subcategory } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'diseno');

    if (!finalImageUrl) {
      return res.status(400).json({
        error: 'La imagen es obligatoria (archivo o URL)',
        code: 'VALIDATION_ERROR',
      });
    }

    const project = await prisma.designProject.create({
      data: {
        title,
        description: description || null,
        imageUrl: finalImageUrl,
        subcategory,
      },
    });

    logger.info('Proyecto de diseño creado', { id: project.id, title: project.title });

    res.status(201).json({ data: project });
  } catch (error) {
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe un proyecto de diseño con ese título',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al crear proyecto de diseño', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, subcategory } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'diseno');

    const project = await prisma.designProject.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
        ...(subcategory !== undefined && { subcategory }),
      },
    });

    logger.info('Proyecto de diseño actualizado', { id: project.id });

    res.status(200).json({ data: project });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Proyecto de diseño no encontrado',
        code: 'NOT_FOUND',
      });
    }
    if (isDuplicateError(error)) {
      return res.status(400).json({
        error: 'Ya existe un proyecto de diseño con ese título',
        code: 'DUPLICATE_ERROR',
      });
    }
    logger.error('Error al actualizar proyecto de diseño', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.designProject.delete({
      where: { id: parseId(id) },
    });

    logger.info('Proyecto de diseño eliminado', { id: parseId(id) });

    res.status(200).json({
      data: { message: 'Proyecto de diseño eliminado correctamente' },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({
        error: 'Proyecto de diseño no encontrado',
        code: 'NOT_FOUND',
      });
    }
    logger.error('Error al eliminar proyecto de diseño', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * HU08 - Filtrar Diseño
 * Endpoint GET /api/v1/design
 *
 * Lista proyectos de diseño, opcionalmente filtrados por subcategoría.
 *
 * @param {string} [req.query.subcategory] - Subcategoría por la que filtrar
 * @returns {Object} 200 - { data: [{ id, title, subcategory, imageUrl, description }] }
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Endpoint público (no requiere autenticación)
 */
const listFiltered = async (req, res) => {
  try {
    const { subcategory } = req.query;

    if (subcategory && !DESIGN_SUBCATEGORIES.includes(subcategory)) {
      return res.status(404).json({
        error: 'Subcategoría inválida',
        code: 'NOT_FOUND',
      });
    }

    const projects = subcategory
      ? await prisma.designProject.findMany({ where: { subcategory } })
      : await prisma.designProject.findMany();

    res.status(200).json({ data: projects });
  } catch (error) {
    logger.error('Error al listar proyectos de diseño', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { create, update, remove, listFiltered };

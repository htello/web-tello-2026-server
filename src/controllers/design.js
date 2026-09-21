/**
 * @fileoverview Controlador de proyectos de diseño.
 *
 * Implementa los handlers públicos (HU08) y de administración
 * (HU10) para la sección de diseño e ilustración.
 *
 * @module controllers/design
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/http-response
 * @requires lib/constants
 * @requires services/upload
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { resolveImageUrl } from '../services/upload.js';
import { parseId, isNotFoundError, isDuplicateError } from '../lib/prisma-utils.js';
import { sendSuccess, sendError, sendNotFound, sendDuplicate, sendInternalError } from '../lib/http-response.js';
import { DESIGN_SUBCATEGORIES } from '../lib/constants.js';

/**
 * HU10 - Crear proyecto de diseño
 * Endpoint POST /api/v1/admin/design
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con proyecto creado, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { title, description, imageUrl, subcategory, isPublished, isFeatured } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'diseno');

    if (!finalImageUrl) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen es obligatoria (archivo o URL)');
    }

    const project = await prisma.designProject.create({
      data: {
        title,
        description: description || null,
        imageUrl: finalImageUrl,
        subcategory,
        ...(isPublished !== undefined && { isPublished }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    logger.info('Proyecto de diseño creado', { id: project.id, title: project.title });

    return sendSuccess(res, project, 201);
  } catch (error) {
    if (isDuplicateError(error)) {
      return sendDuplicate(res, 'Ya existe un proyecto de diseño con ese título');
    }
    return sendInternalError(res, logger, 'Error al crear proyecto de diseño', error);
  }
};

/**
 * HU10 - Actualizar proyecto de diseño
 * Endpoint PUT /api/v1/admin/design/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con proyecto actualizado, 404, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, subcategory, isPublished, isFeatured } = req.body;

    const finalImageUrl = await resolveImageUrl(req.file, imageUrl, 'diseno');

    const project = await prisma.designProject.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
        ...(subcategory !== undefined && { subcategory }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    logger.info('Proyecto de diseño actualizado', { id: project.id });

    return sendSuccess(res, project);
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Proyecto de diseño no encontrado');
    if (isDuplicateError(error)) return sendDuplicate(res, 'Ya existe un proyecto de diseño con ese título');
    return sendInternalError(res, logger, 'Error al actualizar proyecto de diseño', error);
  }
};

/**
 * HU10 - Eliminar proyecto de diseño
 * Endpoint DELETE /api/v1/admin/design/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.designProject.delete({
      where: { id: parseId(id) },
    });

    logger.info('Proyecto de diseño eliminado', { id: parseId(id) });

    return sendSuccess(res, { message: 'Proyecto de diseño eliminado correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Proyecto de diseño no encontrado');
    return sendInternalError(res, logger, 'Error al eliminar proyecto de diseño', error);
  }
};

/**
 * HU08 - Filtrar Diseño
 * Endpoint GET /api/v1/design
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con proyectos, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listFiltered = async (req, res) => {
  try {
    const { subcategory } = req.query;

    if (subcategory && !DESIGN_SUBCATEGORIES.includes(subcategory)) {
      return sendNotFound(res, 'Subcategoría inválida');
    }

    const projects = subcategory
      ? await prisma.designProject.findMany({ where: { subcategory, isPublished: true } })
      : await prisma.designProject.findMany({ where: { isPublished: true } });

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
const listFeatured = async (req, res) => {
  try {
    const projects = await prisma.designProject.findMany({
      where: { isFeatured: true, isPublished: true },
    });

    return sendSuccess(res, projects);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar proyectos de diseño destacados', error);
  }
};

export { create, update, remove, listFiltered, listFeatured };

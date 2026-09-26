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
import { resolveImageAsset } from '../services/upload.js';
import { deleteCloudinaryImage, extractPublicId } from '../services/cloudinary.js';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from '../lib/prisma-utils.js';
import { sendSuccess, sendError, sendNotFound, sendDuplicate, sendInternalError } from '../lib/http-response.js';
import { DESIGN_SUBCATEGORIES, STABLE_POSITION_ORDER } from '../lib/constants.js';

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

    const imageAsset = await resolveImageAsset(req.file, imageUrl, 'diseno');
    const finalImageUrl = imageAsset.url;

    if (!finalImageUrl) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen es obligatoria (archivo o URL)');
    }

    const project = await prisma.designProject.create({
      data: {
        title,
        description: description || null,
        imageUrl: finalImageUrl,
        ...((imageAsset.publicId || extractPublicId(finalImageUrl)) && {
          imagePublicId: imageAsset.publicId || extractPublicId(finalImageUrl),
        }),
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

    const imageAsset = await resolveImageAsset(req.file, imageUrl, 'diseno');
    const finalImageUrl = imageAsset.url;

    if (Object.prototype.hasOwnProperty.call(req.body, 'imageUrl') && !req.file && !finalImageUrl) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen es obligatoria (archivo o URL)');
    }

    if (finalImageUrl) {
      const previousProject = await prisma.designProject.findUnique({
        where: { id: parseId(id) },
        select: { imageUrl: true, imagePublicId: true },
      });

      if (previousProject && previousProject.imageUrl !== finalImageUrl) {
        await deleteCloudinaryImage(previousProject.imagePublicId, previousProject.imageUrl);
      }
    }

    const project = await prisma.designProject.update({
      where: { id: parseId(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
        ...(finalImageUrl && (imageAsset.publicId || extractPublicId(finalImageUrl)) && {
          imagePublicId: imageAsset.publicId || extractPublicId(finalImageUrl),
        }),
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

    const project = await prisma.designProject.findUnique({
      where: { id: parseId(id) },
      select: { imageUrl: true, imagePublicId: true },
    });

    if (project === null) {
      return sendNotFound(res, 'Proyecto de diseño no encontrado');
    }

    if (project) {
      await deleteCloudinaryImage(project.imagePublicId, project.imageUrl);
    }

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
 * HU10 - Listar todos los proyectos de diseño (admin)
 * Endpoint GET /api/v1/admin/design
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con todos los proyectos o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const listAll = async (req, res) => {
  try {
    const projects = await prisma.designProject.findMany({
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, projects);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar proyectos de diseño', error);
  }
};

/**
 * HU10 - Reordenar proyectos de diseño
 * Endpoint PUT /api/v1/admin/design/reorder
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, prisma.designProject, orderedIds);

    logger.info('Proyectos de diseño reordenados', { count: orderedIds.length });

    return sendSuccess(res, { message: 'Orden actualizado correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Uno o más IDs no existen');
    }
    return sendInternalError(res, logger, 'Error al reordenar proyectos de diseño', error);
  }
};

/**
 * HU08 - Filtrar Diseño
 * Endpoint GET /api/v1/design
 *
 * Lista proyectos publicados filtrando obligatoriamente por subcategoría.
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con proyectos, 400, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const listFiltered = async (req, res) => {
  try {
    const { subcategory } = req.query;

    if (!subcategory) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La subcategoría es obligatoria');
    }

    if (!DESIGN_SUBCATEGORIES.includes(subcategory)) {
      return sendNotFound(res, 'Subcategoría inválida');
    }

    const projects = await prisma.designProject.findMany({
      where: { subcategory, isPublished: true },
      orderBy: STABLE_POSITION_ORDER,
    });

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
      orderBy: STABLE_POSITION_ORDER,
    });

    return sendSuccess(res, projects);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar proyectos de diseño destacados', error);
  }
};

export { create, update, remove, reorder, listAll, listFiltered, listFeatured };

/**
 * @fileoverview Controlador de biografía.
 *
 * Implementa los handlers públicos (HU11) y de administración
 * (HU12) para la biografía del artista.
 *
 * @module controllers/biography
 * @requires lib/prisma
 * @requires lib/http-response
 * @requires services/logger
 */

import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { resolveImageAsset } from '../services/upload.js';
import { sendSuccess, sendError, sendNotFound, sendInternalError } from '../lib/http-response.js';
import { deleteCloudinaryImage, extractPublicId } from '../services/cloudinary.js';

/**
 * HU11 - Leer biografía
 * Endpoint GET /api/v1/biography
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con biografía, 404 o 500
 * @security Endpoint público (no requiere autenticación)
 */
const get = async (req, res) => {
  try {
    const biography = await prisma.biography.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!biography) return sendNotFound(res, 'Biografía no encontrada');

    return sendSuccess(res, biography);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener biografía', error);
  }
};

/**
 * HU12 - Crear biografía
 * Endpoint POST /api/v1/admin/biography
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.file - Archivo de imagen (multipart, opcional)
 * @param {Object} req.body - content (requerido) e imageUrl (opcional)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con biografía creada, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const create = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    const existing = await prisma.biography.findFirst();
    if (existing) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Ya existe una biografía');
    }

    const imageAsset = await resolveImageAsset(req.file, imageUrl, 'general');
    const finalImageUrl = imageAsset.url;

    const biography = await prisma.biography.create({
      data: {
        content,
        imageUrl: finalImageUrl || null,
        ...((imageAsset.publicId || extractPublicId(finalImageUrl)) && {
          imagePublicId: imageAsset.publicId || extractPublicId(finalImageUrl),
        }),
      },
    });

    logger.info('Biografía creada', { id: biography.id });

    return sendSuccess(res, biography, 201);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al crear biografía', error);
  }
};

/**
 * HU12 - Actualizar biografía
 * Endpoint PUT /api/v1/admin/biography
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.file - Archivo de imagen (multipart, opcional)
 * @param {Object} req.body - content (requerido) e imageUrl (opcional)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con biografía actualizada, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    const existing = await prisma.biography.findFirst();
    if (!existing) return sendNotFound(res, 'Biografía no encontrada');

    const imageAsset = await resolveImageAsset(req.file, imageUrl, 'general');
    const finalImageUrl = imageAsset.url;

    const data = {};
    if (content !== undefined) data.content = content;
    if (finalImageUrl) {
      await deleteCloudinaryImage(existing.imagePublicId, existing.imageUrl);
      data.imageUrl = finalImageUrl;
      const imagePublicId = imageAsset.publicId || extractPublicId(finalImageUrl);
      if (imagePublicId) data.imagePublicId = imagePublicId;
    }

    const biography = await prisma.biography.update({
      where: { id: existing.id },
      data,
    });

    logger.info('Biografía actualizada', { id: biography.id });

    return sendSuccess(res, biography);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al actualizar biografía', error);
  }
};

export { get, create, update };

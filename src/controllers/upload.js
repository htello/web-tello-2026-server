/**
 * @fileoverview Controller de upload de archivos.
 *
 * HU16 - Upload de Archivos
 * Endpoint POST /api/v1/admin/upload
 *
 * Recibe un archivo multipart/form-data, lo valida
 * y lo sube a Cloudinary retornando URLs optimizadas.
 *
 * @module controllers/upload
 * @requires services/upload
 * @requires lib/http-response
 * @requires services/logger
 */

import { uploadToCloudinary, ALLOWED_SECTIONS } from '../services/upload.js';
import logger from '../services/logger.js';
import { sendSuccess, sendError, sendInternalError } from '../lib/http-response.js';

/**
 * HU16 - Upload de Archivos
 * Sube una imagen a Cloudinary y retorna URLs
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.file - Archivo multer (buffer, mimetype)
 * @param {string} req.body.section - Sección para subcarpeta (pintura, ilustracion, diseno, general)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con URLs, 400 o 500
 * @security Bearer token requerido (Admin)
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No se proporcionó archivo');
    }

    const section = req.body?.section || 'general';

    if (!ALLOWED_SECTIONS.includes(section)) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        `Sección no válida. Permitidas: ${ALLOWED_SECTIONS.join(', ')}`
      );
    }

    const result = await uploadToCloudinary(req.file, section);

    logger.info('Archivo subido exitosamente', { url: result.url, section });

    return sendSuccess(res, result);
  } catch (error) {
    return sendInternalError(res, logger, 'Error en upload', error);
  }
};

export { uploadFile };

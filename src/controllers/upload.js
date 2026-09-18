/**
 * @fileoverview Controller de upload de archivos.
 *
 * HU16 - Upload de Archivos
 * Endpoint POST /api/v1/admin/upload
 *
 * Recibe un archivo multipart/form-lofdata, lo valida
 * y lo sube a Cloudinary retornando URLs optimizadas.
 *
 * @module controllers/upload
 * @requires services/upload
 * @requires services/logger
 */

import { uploadToCloudinary } from '../services/upload.js';
import logger from '../services/logger.js';

/**
 * HU16 - Upload de Archivos
 * Sube una imagen a Cloudinary y retorna URLs
 *
 * @param {Object} req.file - Archivo multer (buffer, mimetype)
 * @returns {Object} 200 - { data: { url, thumbnail, width, height, format } }
 * @returns {Object} 400 - { error, code: 'VALIDATION_ERROR' }
 * @returns {Object} 500 - { error, code: 'INTERNAL_ERROR' }
 *
 * @security Bearer token requerido (Admin)
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó archivo',
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await uploadToCloudinary(req.file);

    logger.info('Archivo subido exitosamente', { url: result.url });

    res.json({ data: result });
  } catch (error) {
    logger.error('Error en upload', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { uploadFile };

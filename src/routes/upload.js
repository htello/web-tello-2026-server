/**
 * @fileoverview Rutas de upload de archivos.
 *
 * HU16 - Upload de Archivos
 * Define el endpoint POST / para subir imágenes a Cloudinary.
 * Requiere autenticación JWT de administrador.
 *
 * @module routes/upload
 * @requires express
 * @requires middleware/auth
 * @requires services/upload
 * @requires controllers/upload
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../services/upload.js';
import { uploadFile } from '../controllers/upload.js';

const router = Router();

/**
 * POST /
 * HU16 - Upload de Archivos
 *
 * Sube una imagen (JPEG, PNG, WebP) a Cloudinary.
 * Máximo 5MB por archivo.
 *
 * @security Bearer token requerido (Admin)
 * @param {File} file - Imagen en multipart/form-data (campo "file")
 * @returns {Object} 200 - { data: { url, thumbnail, width, height, format } }
 * @returns {Object} 400 - Archivo no válido o no proporcionado
 * @returns {Object} 401 - Token no proporcionado
 * @returns {Object} 403 - Token inválido o no admin
 */
router.post('/', authenticate, requireAdmin, upload.single('file'), uploadFile);

export default router;

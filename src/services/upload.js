/**
 * @fileoverview Servicio de upload de archivos a Cloudinary.
 *
 * Configura Multer para recibir archivos multipart/form-data
 * y sube imágenes válidas a Cloudinary con transformación automática.
 *
 * @module services/upload
 * @requires cloudinary
 * @requires multer
 */

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

/**
 * Tipos MIME permitidos para upload
 * @type {string[]}
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Tamaño máximo de archivo: 5MB
 * @type {number}
 */
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Configuración de Multer con almacenamiento en memoria
 * y validación de tipo MIME y tamaño
 * @type {multer.Multer}
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten: image/jpeg, image/png, image/webp'), false);
    }
  },
});

/**
 * HU16 - Upload a Cloudinary
 * Sube un archivo buffer a Cloudinary y retorna URLs optimizadas
 *
 * @param {Object} file - Archivo de Multer con buffer y mimetype
 * @param {Buffer} file.buffer - Contenido del archivo
 * @param {string} file.mimetype - Tipo MIME del archivo
 * @returns {Promise<Object>} URLs y metadata de la imagen subida
 */
const uploadToCloudinary = async (file) => {
  const b64 = file.buffer.toString('base64');
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'portfolio',
    transformation: [{ width: 1200, crop: 'limit' }],
  });

  return {
    url: result.secure_url,
    thumbnail: cloudinary.url(result.public_id, { width: 300, crop: 'limit' }),
    width: result.width,
    height: result.height,
    format: result.format,
  };
};

export { upload, uploadToCloudinary, ALLOWED_TYPES, MAX_SIZE };

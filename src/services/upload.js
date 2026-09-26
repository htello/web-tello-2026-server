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
import { IMAGE_MAX_WIDTH, IMAGE_THUMBNAIL_WIDTH } from '../lib/constants.js';

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
 * Secciones permitidas para subcarpetas en Cloudinary
 * (válidas como `section` en POST /admin/upload)
 * @type {string[]}
 */
const ALLOWED_SECTIONS = ['pintura', 'ilustracion', 'diseno', 'general', 'exposiciones'];

/**
 * Carpetas Cloudinary válidas para uploadToCloudinary.
 * Incluye 'test' para uso interno (scripts y pruebas);
 * no se expone en el endpoint de upload.
 * @type {string[]}
 */
const CLOUDINARY_FOLDERS = [...ALLOWED_SECTIONS, 'test'];

/**
 * Limpia el nombre del archivo para usarlo como public_id en Cloudinary
 * Elimina caracteres especiales y espacios
 *
 * @param {string} filename - Nombre original del archivo
 * @returns {string} Nombre limpio sin extensión
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/\.[^/.]+$/, '')           // Eliminar extensión
    .replace(/[^a-zA-Z0-9_-]/g, '-')    // Reemplazar caracteres especiales con guiones
    .replace(/-+/g, '-')                 // Reemplazar guiones múltiples con uno solo
    .replace(/^-|-$/g, '');              // Eliminar guiones al inicio y final
};

/**
 * Filtro de archivos para Multer
 * Valida que el tipo MIME esté en la lista de permitidos
 *
 * @param {Object} req - Request de Express
 * @param {Object} file - Archivo de Multer con mimetype
 * @param {Function} cb - Callback de Multer (error, accepted)
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten: image/jpeg, image/png, image/webp'), false);
  }
};

/**
 * Configuración de Multer con almacenamiento en memoria
 * y validación de tipo MIME y tamaño
 * @type {multer.Multer}
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

/**
 * HU16 - Upload a Cloudinary
 * Sube un archivo buffer a Cloudinary y retorna URLs optimizadas
 *
 * @param {Object} file - Archivo de Multer con buffer, mimetype y originalname
 * @param {Buffer} file.buffer - Contenido del archivo
 * @param {string} file.mimetype - Tipo MIME del archivo
 * @param {string} file.originalname - Nombre original del archivo
 * @param {string} section - Sección para subcarpeta (pintura, ilustracion, diseno, general, exposiciones, test)
 * @returns {Promise<Object>} URLs y metadata de la imagen subida
 */
const uploadToCloudinary = async (file, section = 'general') => {
  const folder = CLOUDINARY_FOLDERS.includes(section)
    ? `portfolio-antonio-tello/${section}`
    : 'portfolio-antonio-tello/general';

  const filename = sanitizeFilename(file.originalname);
  const publicId = `${filename}-${Date.now()}`;

  const b64 = file.buffer.toString('base64');
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder,
    public_id: publicId,
    transformation: [{ width: IMAGE_MAX_WIDTH, crop: 'limit' }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnail: cloudinary.url(result.public_id, { width: IMAGE_THUMBNAIL_WIDTH, crop: 'limit' }),
    width: result.width,
    height: result.height,
    format: result.format,
  };
};

const uploadImageAsset = uploadToCloudinary;

/**
 * Resuelve la imagen y conserva el identificador de Cloudinary.
 *
 * @param {Object} [file] - Archivo de Multer.
 * @param {string} [imageUrl] - URL proporcionada en el body.
 * @param {string} section - Sección para subcarpeta.
 * @returns {Promise<Object>} URL y public_id.
 */
const resolveImageAsset = async (file, imageUrl, section) => {
  if (!file) return { url: imageUrl, publicId: null };

  return uploadToCloudinary(file, section);
};

/**
 * Resuelve la URL de imagen final para un recurso.
 *
 * Si llega un archivo (Multer) lo sube a Cloudinary y usa su URL;
 * en caso contrario usa la URL proporcionada directamente.
 *
 * @param {Object} [file] - Archivo de Multer (buffer, mimetype, originalname)
 * @param {string} [imageUrl] - URL proporcionada en el body
 * @param {string} section - Sección para subcarpeta en Cloudinary
 * @returns {Promise<string|undefined>} URL final o undefined si no hay ni archivo ni URL
 */
const resolveImageUrl = async (file, imageUrl, section) => {
  const result = await resolveImageAsset(file, imageUrl, section);
  return result.url;
};

export {
  upload,
  uploadToCloudinary,
  uploadImageAsset,
  resolveImageAsset,
  resolveImageUrl,
  fileFilter,
  ALLOWED_TYPES,
  MAX_SIZE,
  ALLOWED_SECTIONS,
  CLOUDINARY_FOLDERS,
};

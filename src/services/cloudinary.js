/**
 * @fileoverview Operaciones de eliminación de imágenes en Cloudinary.
 * @module services/cloudinary
 * @security No expone credenciales ni datos sensibles.
 */

import { v2 as cloudinary } from 'cloudinary';

/**
 * Extrae el public_id de una URL de Cloudinary.
 *
 * @param {string|null|undefined} imageUrl - URL de imagen.
 * @returns {string|null} public_id o null si no es Cloudinary.
 */
const extractPublicId = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('res.cloudinary.com')) return null;

  const pathname = new URL(imageUrl).pathname;
  const uploadIndex = pathname.indexOf('/upload/');
  if (uploadIndex === -1) return null;

  const segments = pathname.slice(uploadIndex + '/upload/'.length).split('/');
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments = versionIndex === -1 ? segments : segments.slice(versionIndex + 1);
  const publicId = publicIdSegments.join('/').replace(/\.[^/.]+$/, '');

  return publicId || null;
};

/**
 * Elimina una imagen de Cloudinary.
 *
 * @param {string|null|undefined} publicId - public_id persistido.
 * @param {string|null|undefined} imageUrl - URL legacy opcional.
 * @returns {Promise<void>}
 */
const deleteCloudinaryImage = async (publicId, imageUrl) => {
  const resolvedPublicId = publicId || extractPublicId(imageUrl);
  if (!resolvedPublicId) return;

  const result = await cloudinary.uploader.destroy(resolvedPublicId, { resource_type: 'image' });

  if (!['ok', 'not found'].includes(result?.result)) {
    throw new Error(`Cloudinary no eliminó la imagen: ${resolvedPublicId}`);
  }
};

export { deleteCloudinaryImage, extractPublicId };

/**
 * @fileoverview Controlador de gestión de usuarios (Admin).
 *
 * Implementa los handlers de listado, detalle, edición, eliminación
 * y reseteo de contraseña de usuarios para el panel de administración.
 *
 * @module controllers/users
 * @requires bcrypt
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/constants
 * @requires lib/http-response
 * @requires services/logger
 */

import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { BCRYPT_ROUNDS } from '../lib/constants.js';
import { parseId, isNotFoundError, isDuplicateError } from '../lib/prisma-utils.js';
import { sendSuccess, sendNotFound, sendDuplicate, sendPaginated, sendInternalError } from '../lib/http-response.js';
import { parsePagination, buildPaginationMeta } from '../lib/pagination.js';

/**
 * Campos públicos del usuario (sin password).
 * @type {Object}
 */
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
};

/**
 * Listar todos los usuarios con paginación.
 * Endpoint GET /api/v1/admin/users
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.query.page - Número de página (default 1)
 * @param {Object} req.query.limit - Elementos por página (default 20, max 100)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con data y meta, o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const list = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        select: USER_SELECT,
      }),
      prisma.user.count(),
    ]);

    return sendPaginated(res, users, buildPaginationMeta(total, page, limit));
  } catch (error) {
    return sendInternalError(res, logger, 'Error al listar usuarios', error);
  }
};

/**
 * Obtener detalle de un usuario.
 * Endpoint GET /api/v1/admin/users/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params.id - ID del usuario
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con usuario, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseId(id) },
      select: USER_SELECT,
    });

    if (!user) return sendNotFound(res, 'Usuario no encontrado');

    return sendSuccess(res, user);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al obtener usuario', error);
  }
};

/**
 * Editar un usuario (email, nombre, rol).
 * Endpoint PUT /api/v1/admin/users/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params.id - ID del usuario
 * @param {Object} req.body - Campos a actualizar (email, name, role)
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con usuario actualizado, 404, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    const user = await prisma.user.update({
      where: { id: parseId(id) },
      data: {
        ...(email !== undefined && { email }),
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
      },
      select: USER_SELECT,
    });

    logger.info('Usuario actualizado', { id: user.id });

    return sendSuccess(res, user);
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Usuario no encontrado');
    if (isDuplicateError(error)) return sendDuplicate(res, 'Ya existe un usuario con ese email');
    return sendInternalError(res, logger, 'Error al actualizar usuario', error);
  }
};

/**
 * Eliminar un usuario.
 * Endpoint DELETE /api/v1/admin/users/:id
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params.id - ID del usuario
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseId(id) },
    });

    logger.info('Usuario eliminado', { id: parseId(id) });

    return sendSuccess(res, { message: 'Usuario eliminado correctamente' });
  } catch (error) {
    if (isNotFoundError(error)) return sendNotFound(res, 'Usuario no encontrado');
    return sendInternalError(res, logger, 'Error al eliminar usuario', error);
  }
};

/**
 * Resetear la contraseña de un usuario.
 * Endpoint PUT /api/v1/admin/users/:id/password
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params.id - ID del usuario
 * @param {Object} req.body - Contraseña nueva
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 404 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: parseId(id) },
    });

    if (!existing) return sendNotFound(res, 'Usuario no encontrado');

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: parseId(id) },
      data: { password: hashedPassword },
    });

    logger.info('Contraseña de usuario actualizada', { id: existing.id });

    return sendSuccess(res, { message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return sendInternalError(res, logger, 'Error al resetear contraseña', error);
  }
};

export { list, getById, update, remove, resetPassword };

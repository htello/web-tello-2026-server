/**
 * @fileoverview Controlador de autenticación.
 *
 * Implementa los handlers de login (HU20) y registro de
 * administradores (HU22).
 *
 * @module controllers/auth
 * @requires bcrypt
 * @requires jsonwebtoken
 * @requires lib/prisma
 * @requires lib/constants
 * @requires lib/http-response
 * @requires services/logger
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { JWT_SECRET, JWT_EXPIRATION, BCRYPT_ROUNDS } from '../lib/constants.js';
import { sendSuccess, sendError, sendInternalError } from '../lib/http-response.js';

/**
 * HU20 - Login Admin
 * Endpoint POST /api/v1/auth/login
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con token, 401 o 500
 * @security Endpoint público protegido por rate limiting
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Credenciales inválidas');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    logger.info('Login exitoso', { userId: user.id, email: user.email });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return sendInternalError(res, logger, 'Error en login', error);
  }
};

/**
 * HU22 - Registro de Administradores
 * Endpoint POST /api/v1/admin/users/register
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con usuario creado, 400 o 500
 * @security Requiere Bearer token con rol ADMIN
 */
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    logger.info('Admin registrado', { id: newUser.id, email: newUser.email });

    return sendSuccess(res, {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    }, 201);
  } catch (error) {
    return sendInternalError(res, logger, 'Error en registro', error);
  }
};

export { login, register };

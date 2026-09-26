/**
 * @fileoverview Controlador de autenticación.
 *
 * Implementa los handlers de login (HU20) y registro de
 * administradores (HU22).
 *
 * @module controllers/auth
 * @requires bcrypt
 * @requires jsonwebtoken
 * @requires node:crypto
 * @requires lib/prisma
 * @requires lib/constants
 * @requires lib/http-response
 * @requires services/email
 * @requires services/logger
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import prisma from '../lib/prisma.js';
import logger from '../services/logger.js';
import { sendPasswordResetEmail } from '../services/email.js';
import {
  JWT_SECRET,
  JWT_EXPIRATION,
  BCRYPT_ROUNDS,
  FRONTEND_URL,
  RESET_TOKEN_EXPIRES_MINUTES,
  RESET_TOKEN_BYTES,
  ADMIN_ROLE,
  MS_PER_MINUTE,
  INVALID_CREDENTIALS_MESSAGE,
} from '../lib/constants.js';
import { sendSuccess, sendValidationError, sendUnauthorized, sendInternalError } from '../lib/http-response.js';

/**
 * Calcula el hash SHA-256 de un token de recuperación.
 *
 * @param {string} token - Token en claro
 * @returns {string} Hash hexadecimal
 * @security Solo el hash se persiste en la base de datos
 */
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

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
      return sendUnauthorized(res, INVALID_CREDENTIALS_MESSAGE);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendUnauthorized(res, INVALID_CREDENTIALS_MESSAGE);
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
      return sendValidationError(res, 'El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: ADMIN_ROLE,
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

/**
 * Solicitud de recuperación de contraseña
 * Endpoint POST /api/v1/auth/forgot-password
 *
 * Genera un token de un solo uso (hash SHA-256 en BD, 1 h de validez)
 * y envía el enlace por email. Responde siempre 200 genérico para no
 * revelar si el email está registrado (OWASP).
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.body - { email }
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con mensaje genérico o 500
 * @security Endpoint público protegido por rate limiting
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = 'Si el email está registrado, recibirás un enlace para restablecer la contraseña';

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('hex');
      const passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * MS_PER_MINUTE);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashToken(rawToken),
          passwordResetExpires,
        },
      });

      const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
      const result = await sendPasswordResetEmail(user.email, resetLink);

      if (result.success) {
        logger.info('Email de recuperación enviado', { userId: user.id });
      } else {
        logger.error('Fallo al enviar email de recuperación', { userId: user.id, error: result.error });
      }
    }

    return sendSuccess(res, { message: genericMessage });
  } catch (error) {
    return sendInternalError(res, logger, 'Error en recuperación de contraseña', error);
  }
};

/**
 * Restablecer contraseña con token
 * Endpoint POST /api/v1/auth/reset-password
 *
 * Valida el token (hash + expiración), actualiza la contraseña y
 * consume el token (un solo uso).
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.body - { token, password }
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 200 con confirmación, 400 o 500
 * @security Endpoint público protegido por rate limiting
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: hashToken(token) },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return sendValidationError(res, 'Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    logger.info('Contraseña restablecida', { userId: user.id });

    return sendSuccess(res, { message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return sendInternalError(res, logger, 'Error al restablecer contraseña', error);
  }
};

export { login, register, forgotPassword, resetPassword };

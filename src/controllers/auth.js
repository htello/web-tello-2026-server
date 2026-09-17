import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../services/logger.js';
import { JWT_SECRET, JWT_EXPIRATION } from '../lib/constants.js';

const prisma = new PrismaClient();

/**
 * HU20 - Login Admin
 * Endpoint POST /api/v1/auth/login
 *
 * Autentica al administrador con email y password.
 * Retorna JWT token y datos del usuario.
 *
 * @param {Object} req.body.email - Email del usuario
 * @param {Object} req.body.password - Contraseña (mínimo 8 caracteres)
 * @returns {Object} 200 - { data: { token, user } }
 * @returns {Object} 401 - { error, code: 'UNAUTHORIZED' }
 * @returns {Object} 500 - { error, code: 'INTERNAL_ERROR' }
 *
 * @security Bearer token requerido para rutas admin
 * @example Request
 * { "email": "admin@test.com", "password": "admin123" }
 * @example Response 200
 * { "data": { "token": "eyJ...", "user": { "id": 1, "email": "admin@test.com", "role": "ADMIN" } } }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'UNAUTHORIZED',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'UNAUTHORIZED',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    logger.info('Login exitoso', { userId: user.id, email: user.email });

    res.status(200).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error('Error en login', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { login };

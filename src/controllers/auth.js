import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../services/logger.js';
import { JWT_SECRET, JWT_EXPIRATION, BCRYPT_ROUNDS } from '../lib/constants.js';

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

/**
 * HU22 - Registro de Administradores
 * Endpoint POST /api/v1/admin/users/register
 *
 * Registra un nuevo usuario con rol ADMIN.
 * Requiere JWT válido de un administrador autenticado.
 *
 * @param {Object} req.body.email - Email del nuevo usuario
 * @param {Object} req.body.password - Contraseña (mínimo 8 caracteres)
 * @param {Object} [req.body.name] - Nombre del usuario (opcional)
 * @returns {Object} 201 - { data: { id, email, name, role } }
 * @returns {Object} 400 - Email ya registrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @security Requiere Bearer token con rol ADMIN
 */
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: 'El email ya está registrado',
        code: 'VALIDATION_ERROR',
      });
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

    res.status(201).json({
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    logger.error('Error en registro', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { login, register };

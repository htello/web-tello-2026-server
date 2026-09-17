import jwt from 'jsonwebtoken';
import logger from '../services/logger.js';
import { JWT_SECRET } from '../lib/constants.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token de autenticación requerido',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', { error: error.message });
    return res.status(403).json({
      error: 'Token inválido o expirado',
      code: 'FORBIDDEN',
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de administrador',
      code: 'FORBIDDEN',
    });
  }
  next();
};

export { authenticate, requireAdmin };

/**
 * @fileoverview Aplicación Express principal del Portfolio Artístico Backend.
 *
 * Configura middlewares de seguridad (Helmet, CORS, rate limiting),
 * rutas de la API v1 y manejo centralizado de errores.
 *
 * @module app
 * @requires express
 * @requires helmet
 * @requires cors
 * @requires middleware/rateLimiter
 */

import { Sentry, isEnabled } from './services/sentry.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import logger from './services/logger.js';
import routes from './routes/index.js';
import { loginLimiter } from './middleware/rateLimiter.js';
import { dbCheck } from './controllers/health.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad: Helmet agrega headers HTTP seguros
app.use(helmet());
// Ocultar X-Powered-By para no revelar tecnología utilizada
app.disable('x-powered-by');

// CORS: Permitir solicitudes desde el frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Parsing de JSON con límite de 1MB
app.use(express.json({ limit: '1mb' }));

/**
 * Rate limiting para endpoint de login
 * - Ventana: 1 minuto
 * - Máximo: 10 intentos por ventana
 * - Previene ataques de fuerza bruta (OWASP A07)
 */
app.use('/api/v1/auth/login', loginLimiter);

/**
 * HU19 - Health Check
 * GET /api/v1/health
 * Retorna estado del servidor y timestamp actual
 */
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Health check de base de datos (monitorización / ping anti-pausa)
 * GET /api/v1/health/db
 * Retorna 200 si la BD responde, 503 en caso contrario
 */
app.get('/api/v1/health/db', dbCheck);

// Rutas de la API v1
app.use('/api/v1', routes);

/**
 * Sentry: captura errores no manejados antes del handler propio.
 * Debe registrarse después de las rutas y antes del middleware de error.
 */
if (isEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

/**
 * Middleware de manejo centralizado de errores
 * Captura errores no manejados y retorna respuesta genérica al cliente
 * (OWASP A10: Exception Handling)
 */
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  });
});

// Iniciar servidor solo si se ejecuta directamente (no al importar para tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

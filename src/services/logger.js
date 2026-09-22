/**
 * @fileoverview Servicio de logging estructurado con Winston.
 *
 * Proporciona logging con niveles configurables via LOG_LEVEL env var.
 * Formato JSON en producción, formato colorizado en consola para desarrollo.
 *
 * @module services/logger
 * @requires winston
 *
 * @example
 * import logger from '../services/logger.js';
 *
 * logger.info('Operación exitosa', { userId: 1 });
 * logger.error('Error en base de datos', { error: err.message });
 * logger.warn('Rate limit alcanzado', { ip: req.ip });
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Formato personalizado para consola con colores
 * Incluye timestamp, nivel y metadata adicional
 */
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} ${level}: ${message} ${metaStr}`;
});

/**
 * Logger principal de la aplicación
 * - Nivel configurable via LOG_LEVEL (default: 'info')
 * - Formato JSON para facilitar parsing en herramientas de monitoreo
 * - Metadata 'service' para identificar el origen en logs agregados
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json(),
  ),
  defaultMeta: { service: 'portfolio-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
    }),
  ],
});

export { logFormat };
export default logger;

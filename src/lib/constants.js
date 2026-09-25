/**
 * @fileoverview Constantes de configuración de la aplicación.
 *
 * Centraliza valores constantes usados en toda la aplicación.
 * Lee valores de variables de entorno con fallbacks para desarrollo/CI.
 *
 * @module lib/constants
 */

/**
 * Secret para firmar/verificar JWT tokens
 * @type {string}
 * @security Debe configurarse en producción via JWT_SECRET env var
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci-minimum-32-characters';

/**
 * Tiempo de expiración de JWT tokens
 * @type {string}
 * @description Formato: '24h', '7d', etc. (ver jsonwebtoken docs)
 */
export const JWT_EXPIRATION = '24h';

/**
 * Número de rounds para hashing de contraseñas con bcrypt
 * @type {number}
 * @description 12 rounds es el estándar recomendado de seguridad
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
export const BCRYPT_ROUNDS = 12;

/**
 * URL base del frontend para enlaces de servicio (p. ej. recuperación de contraseña)
 * @type {string}
 * @security Configurar en producción vía FRONTEND_URL env var
 */
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Expiración del token de recuperación de contraseña, en minutos
 * @type {number}
 */
export const RESET_TOKEN_EXPIRES_MINUTES = 60;

/**
 * Subcategorías válidas para proyectos de diseño (campo subcategory)
 * @type {string[]}
 */
export const DESIGN_SUBCATEGORIES = [
  'imagen-corporativa',
  'packaging-expositores',
  'carteleria',
  'editorial',
];

/**
 * Orden estable para listados: position asc con desempate por id asc.
 * Sin el desempate, filas con position duplicado cambian de orden de forma
 * no determinista tras un UPDATE (orden físico de Postgres).
 * @type {Array<{ position: 'asc' | 'desc', id: 'asc' | 'desc' }>}
 */
export const STABLE_POSITION_ORDER = [{ position: 'asc' }, { id: 'asc' }];

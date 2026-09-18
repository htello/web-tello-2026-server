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

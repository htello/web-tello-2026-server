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

/**
 * Página por defecto en listados paginados
 * @type {number}
 */
export const PAGINATION_DEFAULT_PAGE = 1;

/**
 * Número de elementos por página por defecto en listados paginados
 * @type {number}
 */
export const PAGINATION_DEFAULT_LIMIT = 20;

/**
 * Límite mínimo de elementos por página
 * @type {number}
 */
export const PAGINATION_MIN_LIMIT = 1;

/**
 * Límite máximo de elementos por página
 * @type {number}
 */
export const PAGINATION_MAX_LIMIT = 100;

/**
 * Ventana estándar de rate limiting (1 minuto, en ms)
 * @type {number}
 */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Máximo de peticiones de contacto por ventana
 * @type {number}
 */
export const RATE_LIMIT_CONTACT_MAX = 5;

/**
 * Máximo de intentos de login por ventana
 * @type {number}
 */
export const RATE_LIMIT_LOGIN_MAX = 10;

/**
 * Ventana de rate limiting para recuperación de contraseña (15 minutos, en ms)
 * @type {number}
 */
export const RATE_LIMIT_PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000;

/**
 * Máximo de solicitudes de recuperación de contraseña por ventana
 * @type {number}
 */
export const RATE_LIMIT_PASSWORD_RESET_MAX = 5;

/**
 * Ancho máximo de imagen subida a Cloudinary (crop limit)
 * @type {number}
 */
export const IMAGE_MAX_WIDTH = 1200;

/**
 * Ancho del thumbnail generado por Cloudinary (crop limit)
 * @type {number}
 */
export const IMAGE_THUMBNAIL_WIDTH = 300;

/**
 * Máximo de imágenes por exposición (validación Joi)
 * @type {number}
 */
export const MAX_EXHIBITION_IMAGES = 50;

/**
 * Año mínimo válido para fechas de exposición
 * @type {number}
 */
export const EXHIBITION_YEAR_MIN = 1900;

/**
 * Año máximo válido para fechas de exposición
 * @type {number}
 */
export const EXHIBITION_YEAR_MAX = 2100;

/**
 * Longitud mínima de textos libres (biografía, mensaje de contacto)
 * @type {number}
 */
export const MIN_TEXT_LENGTH = 10;

/**
 * Puerto SMTP por defecto (submission/TLS)
 * @type {number}
 */
export const SMTP_DEFAULT_PORT = 587;

/**
 * Puerto SMTP con conexión segura (TLS implícito)
 * @type {number}
 */
export const SMTP_SECURE_PORT = 465;

/**
 * Timeout de conexión SMTP (ms)
 * @type {number}
 */
export const SMTP_CONNECTION_TIMEOUT_MS = 10000;

/**
 * Timeout de saludo SMTP (ms)
 * @type {number}
 */
export const SMTP_GREETING_TIMEOUT_MS = 10000;

/**
 * Timeout de socket SMTP (ms)
 * @type {number}
 */
export const SMTP_SOCKET_TIMEOUT_MS = 30000;

/**
 * Tamaño en bytes del token aleatorio de recuperación de contraseña
 * @type {number}
 */
export const RESET_TOKEN_BYTES = 32;

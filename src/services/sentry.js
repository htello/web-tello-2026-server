/**
 * @fileoverview Servicio de monitoreo de errores y observabilidad con Sentry.
 *
 * Inicializa el SDK de Sentry únicamente cuando la variable de entorno
 * SENTRY_DSN está definida. Si no hay DSN, el servicio queda desactivado
 * (no envía eventos) para no interferir en entornos locales, de tests o CI.
 *
 * La integración de Express captura automáticamente errores y trazas de
 * las peticiones una vez inicializado el SDK.
 *
 * @module services/sentry
 * @requires @sentry/node
 */

import * as Sentry from '@sentry/node';

/**
 * DSN de Sentry. Define si el monitoreo está activo.
 * @type {string|undefined}
 */
const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Entorno actual de la aplicación (development por defecto).
 * @type {string}
 */
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Release opcional (sha de commit o versión) para asociar eventos.
 * @type {string|undefined}
 */
const RELEASE = process.env.SENTRY_RELEASE;

/**
 * Indica si el monitoreo de errores está habilitado.
 * @type {boolean}
 */
const isEnabled = Boolean(SENTRY_DSN);

if (isEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    integrations: [Sentry.expressIntegration()],
    tracesSampleRate: 1.0,
  });
}

export { Sentry, isEnabled };

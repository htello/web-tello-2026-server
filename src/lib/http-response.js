/**
 * @fileoverview Helpers de respuesta HTTP.
 *
 * Centraliza la construcción de respuestas JSON de la API para
 * eliminar bloques repetidos en los controladores.
 *
 * @module lib/http-response
 */

/**
 * Envía una respuesta de éxito con la estructura `{ data }`.
 *
 * @param {Object} res - Response de Express
 * @param {*} data - Payload de la respuesta
 * @param {number} [status=200] - Código de estado HTTP
 * @returns {Object} Respuesta JSON de Express
 */
const sendSuccess = (res, data, status = 200) => res.status(status).json({ data });

/**
 * Envía una respuesta de error con la estructura `{ error, code }`.
 *
 * @param {Object} res - Response de Express
 * @param {number} status - Código de estado HTTP
 * @param {string} code - Código de error de negocio
 * @param {string} error - Mensaje de error
 * @returns {Object} Respuesta JSON de Express
 */
const sendError = (res, status, code, error) => res.status(status).json({ error, code });

/**
 * Envía un error 404 "recurso no encontrado".
 *
 * @param {Object} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} Respuesta JSON de Express
 */
const sendNotFound = (res, message) => sendError(res, 404, 'NOT_FOUND', message);

/**
 * Envía un error 400 por violación de constraint único.
 *
 * @param {Object} res - Response de Express
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} Respuesta JSON de Express
 */
const sendDuplicate = (res, message) => sendError(res, 400, 'DUPLICATE_ERROR', message);

/**
 * Registra el error y envía un 500 genérico.
 *
 * @param {Object} res - Response de Express
 * @param {Object} logger - Instancia del logger Winston
 * @param {string} context - Descripción del error para el log
 * @param {Object} error - Error capturado
 * @returns {Object} Respuesta JSON de Express
 */
const sendInternalError = (res, logger, context, error) => {
  logger.error(context, { error: error.message });
  return sendError(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor');
};

export { sendSuccess, sendError, sendNotFound, sendDuplicate, sendInternalError };

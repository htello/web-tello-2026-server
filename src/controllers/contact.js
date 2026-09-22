/**
 * @fileoverview Controlador del formulario de contacto.
 *
 * Procesa los mensajes de contacto y los envía por email al administrador.
 *
 * @module controllers/contact
 * @requires services/email
 * @requires lib/http-response
 * @requires services/logger
 */

import { sendContactEmail } from '../services/email.js';
import logger from '../services/logger.js';
import { sendSuccess, sendError, sendInternalError } from '../lib/http-response.js';

/**
 * Envía el mensaje de contacto al administrador.
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.body - { name, email, subject, message }
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con confirmación, 502 si falla el envío o 500 en error
 * @security Endpoint público protegido por rate limiting
 */
const send = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const result = await sendContactEmail({ name, email, subject, message });

    if (!result.success) {
      logger.error('Fallo en el envío del email de contacto', { error: result.error });
      return sendError(
        res,
        502,
        'EMAIL_ERROR',
        'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde'
      );
    }

    return sendSuccess(res, { message: 'Mensaje enviado correctamente' }, 201);
  } catch (error) {
    return sendInternalError(res, logger, 'Error al procesar formulario de contacto', error);
  }
};

export { send };

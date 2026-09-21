/**
 * @fileoverview Controlador del formulario de contacto.
 *
 * Procesa los mensajes de contacto y los envía por email al administrador.
 *
 * @module controllers/contact
 * @requires services/email
 * @requires services/logger
 */

import { sendContactEmail } from '../services/email.js';
import logger from '../services/logger.js';

/**
 * Envía el mensaje de contacto al administrador.
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.body - { name, email, subject, message }
 * @param {Object} res - Response de Express
 * @returns {Promise<Object>} 201 con confirmación o 500 en error
 * @security Endpoint público protegido por rate limiting
 */
const send = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    await sendContactEmail({ name, email, subject, message });

    res.status(201).json({
      data: { message: 'Mensaje enviado correctamente' },
    });
  } catch (error) {
    logger.error('Error al procesar formulario de contacto', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

export { send };

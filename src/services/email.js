/**
 * @fileoverview Servicio de envío de emails con Nodemailer.
 *
 * Configura un transporter SMTP y envía los mensajes del formulario
 * de contacto a la bandeja de correo del administrador.
 *
 * @module services/email
 * @requires nodemailer
 * @requires services/logger
 */

import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Escapa caracteres HTML para prevenir inyección en el cuerpo del email.
 *
 * @param {string} value - Valor a escapar
 * @returns {string} Valor con caracteres HTML escapados
 */
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/**
 * Transporter SMTP configurado mediante variables de entorno.
 * @type {import('nodemailer').Transporter}
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un email con los datos del formulario de contacto.
 *
 * @param {Object} params - Datos del formulario de contacto
 * @param {string} params.name - Nombre del remitente
 * @param {string} params.email - Email del remitente
 * @param {string} params.subject - Asunto del mensaje
 * @param {string} params.message - Cuerpo del mensaje
 * @returns {Promise<{success: boolean, error?: string}>} Resultado del envío
 */
const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `[Contacto] ${subject}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message)}</p>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error al enviar email de contacto', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Envía un email con el enlace de recuperación de contraseña.
 *
 * @param {string} to - Email del destinatario
 * @param {string} resetLink - Enlace completo con el token de recuperación
 * @returns {Promise<{success: boolean, error?: string}>} Resultado del envío
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: '[Portfolio] Restablecer contraseña',
      html: `
        <h2>Restablecer contraseña</h2>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${escapeHtml(resetLink)}">Restablecer contraseña</a></p>
        <p>El enlace caduca en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error al enviar email de recuperación', { error: error.message });
    return { success: false, error: error.message };
  }
};

export { sendContactEmail, sendPasswordResetEmail, transporter };

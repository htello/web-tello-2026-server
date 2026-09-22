/**
 * @fileoverview Servicio de envío de emails.
 *
 * Soporta dos vías de envío:
 * - Resend (API HTTPS) cuando RESEND_API_KEY está definida. Necesaria en
 *   Render free, que bloquea el tráfico saliente a puertos SMTP (25/465/587).
 * - SMTP (Nodemailer) como fallback, usado en desarrollo local.
 *
 * @module services/email
 * @requires nodemailer
 * @requires services/logger
 */

import nodemailer from 'nodemailer';
import logger from './logger.js';

/** URL de la API de Resend para envío de emails. */
const RESEND_API_URL = 'https://api.resend.com/emails';

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
 *
 * `secure` se activa solo con puerto 465 (TLS implícito); con 587 u
 * otros se usa STARTTLS. Los timeouts evitan que un SMTP inaccesible
 * deje peticiones colgadas hasta el límite del proxy.
 *
 * @type {import('nodemailer').Transporter}
 */
const smtpPort = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
});

/**
 * Envía un email vía API HTTPS de Resend.
 *
 * @param {Object} params - Datos del envío
 * @param {string} params.to - Destinatario
 * @param {string} params.subject - Asunto
 * @param {string} params.html - Cuerpo HTML
 * @param {string} [params.replyTo] - Dirección de respuesta
 * @returns {Promise<void>} Nada si OK; lanza Error con el mensaje de Resend
 */
const sendViaResend = async ({ to, subject, html, replyTo }) => {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.message || `Resend respondió ${response.status}`);
  }
};

/**
 * Encamina el envío por Resend (si hay API key) o por SMTP.
 *
 * @param {Object} params - Datos del envío
 * @param {string} params.to - Destinatario
 * @param {string} params.subject - Asunto
 * @param {string} params.html - Cuerpo HTML
 * @param {string} [params.replyTo] - Dirección de respuesta
 * @returns {Promise<void>} Nada si OK; lanza Error en fallo de envío
 */
const dispatchMail = async ({ to, subject, html, replyTo }) => {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, subject, html, replyTo });
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    ...(replyTo && { replyTo }),
    subject,
    html,
  });
};

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
    await dispatchMail({
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
    await dispatchMail({
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

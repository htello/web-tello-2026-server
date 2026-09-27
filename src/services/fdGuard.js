/**
 * @fileoverview Guard de errores asíncronos de I/O en stdout/stderr.
 *
 * En contenedores (Render/Docker) el pipe del colector de logs puede
 * cerrarse transitoriamente; escribir en stdout/stderr genera errores
 * asíncronos (p. ej. `write EIO`) que Node convierte en uncaughtException
 * y reinician el proceso. Este servicio registra listeners que ignoran
 * los códigos de error de descriptor conocidos y re-lanzan el resto.
 *
 * @module services/fdGuard
 */

/**
 * Códigos de error de descriptor ignorables (pipe/log stream roto).
 * @type {string[]}
 */
const IGNORABLE_CODES = ['EIO', 'EPIPE', 'EAGAIN', 'ERR_STREAM_DESTROYED'];

/**
 * Manejador de errores de descriptor: ignora los códigos conocidos
 * y re-lanza cualquier otro para no silenciar fallos reales.
 *
 * @param {NodeJS.ErrnoException} err - Error emitido por el stream.
 * @returns {void}
 * @throws {Error} Si el código de error no es ignorable.
 */
const ignoreFdError = (err) => {
  if (IGNORABLE_CODES.includes(err.code)) return;
  throw err;
};

/**
 * Controla que los listeners se registren una única vez
 * aunque `attachFdGuard` se invoque múltiples veces.
 * @type {boolean}
 */
let attached = false;

/**
 * Registra el guard en `process.stdout` y `process.stderr` (idempotente).
 *
 * @returns {void}
 * @security Evita reinicios del proceso por fallos de I/O del contenedor.
 */
const attachFdGuard = () => {
  if (attached) return;
  attached = true;
  process.stdout.on('error', ignoreFdError);
  process.stderr.on('error', ignoreFdError);
};

export { ignoreFdError, attachFdGuard, IGNORABLE_CODES };

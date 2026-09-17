/**
 * @fileoverview Cliente Prisma singleton.
 *
 * Exporta una instancia única de PrismaClient para evitar
 * múltiples conexiones a la base de datos durante desarrollo
 * (problema común con HMR en Vite/Node.js watch mode).
 *
 * @module lib/prisma
 * @requires @prisma/client
 */

import { PrismaClient } from '@prisma/client';

/**
 * Almacén global para la instancia de Prisma.
 * En desarrollo, se reutiliza la misma instancia entre recargas.
 */
const globalForPrisma = globalThis;

/**
 * Instancia singleton de PrismaClient.
 * Si ya existe en el global, la reutiliza; si no, crea una nueva.
 *
 * @type {PrismaClient}
 * @example
 * import prisma from '../lib/prisma.js';
 * const users = await prisma.user.findMany();
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// En desarrollo, guardar en global para reutilizar entre HMR
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

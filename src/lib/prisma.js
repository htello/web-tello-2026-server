/**
 * @fileoverview Singleton de PrismaClient.
 *
 * Evita múltiples conexiones a la DB en desarrollo.
 * En producción, Prisma recomienda un singleton por proceso.
 *
 * @module lib/prisma
 * @requires @prisma/client
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * @fileoverview Bootstrap del primer administrador en producción.
 *
 * Crea (o promueve) un único usuario ADMIN usando credenciales
 * proporcionadas por variables de entorno. No hardcodea secretos
 * ni los registra en logs.
 *
 * Uso (una sola vez, contra la BD de producción):
 *   DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASS=... node scripts/bootstrap-admin.js
 *
 * @module scripts/bootstrap-admin
 * @requires @prisma/client
 * @requires bcrypt
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9\s]).{8,}$/;

const main = async () => {
  const { ADMIN_EMAIL, ADMIN_PASS, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error('❌ Define ADMIN_EMAIL y ADMIN_PASS como variables de entorno');
    process.exit(1);
  }

  if (!STRONG_PASSWORD_PATTERN.test(ADMIN_PASS)) {
    console.error('❌ ADMIN_PASS debe tener al menos 8 caracteres, una letra mayúscula y un símbolo');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASS, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
      ...(ADMIN_NAME && { name: ADMIN_NAME }),
    },
  });

  console.log(`✅ Admin listo: id=${admin.id} email=${admin.email} role=${admin.role}`);
};

main()
  .catch((e) => {
    console.error('❌ Error durante el bootstrap del admin:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

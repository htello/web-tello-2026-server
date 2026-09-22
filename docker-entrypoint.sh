#!/bin/sh
set -e

echo "Aplicando migraciones de base de datos..."
pnpm exec prisma migrate deploy

echo "Iniciando servidor..."
exec node src/app.js

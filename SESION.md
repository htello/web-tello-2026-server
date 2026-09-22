# Prompt para Nueva Sesión

Copia y pega el bloque inferior al inicio de un nuevo chat para retomar el proyecto:

```text
Reanudando trabajo en Portfolio Artístico Backend.

CONTEXTO Y DOCUMENTACIÓN:
- Backend Node.js + Express + Prisma + PostgreSQL (Docker)
- Documentación principal: AGENTS.md (Reglas críticas, TDD 100%, Git workflow, OWASP)
- Especificación API (Fuente de verdad): docs/openapi.yaml
- Orden de fases y HUs: docs/0002-IMPLEMENTATION-ORDER.md

ESTADO DEL PROYECTO:
- Rama actual: develop
- Cobertura de tests: 100% obligatorio (Vitest)
- Última HU completada y mergeada: HU13/HU14/HU15 - Formulario de Contacto + Email + Rate Limiting
- Última rama mergeada: chore/token-efficiency-docs (índices de docs + reglas de eficiencia de tokens + seed Admin123!)
- gh CLI autenticado en este equipo (cuenta htello)

ESTADO DE LAS HUS POR FASE:
✅ Fase 0: Setup del Proyecto
✅ Fase 1: Auth + Infraestructura (HU20, HU22, HU21, HU19)
✅ Fase 2: Upload de Archivos (HU16 - Multer + Cloudinary)
✅ Fase 3: Admin CRUD (HU06, HU07, HU10, HU12)
✅ Extras: Skill endpoint-tester + Enum DesignSubcategory (typo CARTELERIA corregido) + Fixes Prisma + Sync OpenAPI/docs + Test de consistencia
✅ Fase 4: Galería Pública (HU01 → HU02 → HU03 → HU04 → HU05) - COMPLETADA
✅ Fase 5: Diseño e Ilustración (HU08 → HU09) - COMPLETADA
✅ Fase 6: Resto Backend (HU11 → HU13 → HU14 → HU15) - COMPLETADA
⏳ Fase 7: Frontend-only (HU17 → HU18) - Pendiente de frontend (fuera de alcance del backend; no existe repositorio frontend aún)

CAMBIO DE rama fix/postman-manual-testing (mergeado a develop):
- Gestión de usuarios admin (GET/PUT/DELETE /admin/users, reset password).
- GET /paintings público; GET /design/featured y /illustrations/featured.
- Modelo unificado isPublished (5 entidades) + isFeatured (pinturas/diseño/ilustraciones); filtrado de publicados en listados públicos.
- Biografía: POST /admin/biography (crear + subir imagen); PUT solo actualiza; quitado GET /admin/biography.
- Fix: create/update persistían position/isPublished; reorder devolvía 500 con IDs inexistentes (ahora 400).
- Eliminados toggles PUT /admin/paintings/:id/feature y /publish.

CAMBIOS DE fix/ci-coverage-jwt-secret (mergeado a develop vía PR #1):
- Fix CI: todos los merges a develop fallaban (#46–#51) por cobertura de ramas 99.69% < 100%.
- Causa: CI define JWT_SECRET (ci.yml), así que la rama fallback de src/lib/constants.js:15 nunca se evaluaba; en local pasaba por no tener la variable definida.
- Solución: src/lib/constants.test.js cubre ambas ramas (vi.stubEnv + vi.resetModules + import dinámico).
- Branch protection NO disponible: repo privado en plan Free (requiere GitHub Pro o repo público). Se usa flujo PR + gh pr checks como gate visible.
- Pendiente: revisar endpoints manualmente en Postman (sesión actual).

CAMBIOS DE chore/token-efficiency-docs (mergeado a develop):
- docs/openapi-INDEX.md y docs/postman/INDEX.md: índices ligeros de endpoints (ruta → nº de línea / comando jq); leer el índice y abrir solo el bloque necesario ahorra ~85% de tokens.
- AGENTS.md: nueva sección "Eficiencia de Tokens (OBLIGATORIO)"; escaneos excluyen node_modules/, .opencode/node_modules/, .git/ y lockfiles.
- prisma/seed.js: contraseña admin → Admin123! (política fuerte); sincronizados colección Postman, docs/0001, docs/0002 y skills/endpoint-tester. Tests mantienen su fixture propio admin123 (autónomo, mockean Prisma).

CAMBIOS DE fix/endpoints (rama en curso, pendiente de merge a develop):
- Fix validación: campos numéricos/booleanos/fecha opcionales aceptan string vacío ('' → se trata como no enviado con Joi .empty('')), corrigiendo los 400 en multipart/form-data con campos en blanco (year, position, collectionId, isPublished/isFeatured, date). Nuevos helpers positionField()/yearField() en src/middleware/validate.js.
- Decisión Front↔Back (imágenes): el front usará SIEMPRE raw JSON; la subida de archivos se hace vía POST /api/v1/admin/upload (multipart) → obtener url → enviarla como imageUrl/coverImage en el JSON del POST/PUT. El soporte multipart (upload.single('image')) en paintings/design/illustrations/biography se MANTIENE como capacidad extra ya testada; el front no la usará.
- Pendiente al iniciar el front: configurar CORS_ORIGIN en .env (src/app.js acepta un único origen; en producción, dominio del hosting). Solo añadir soporte multi-origen si se necesitan varios a la vez.
- Riesgo aceptado: uploads huérfanos en Cloudinary si el admin abandona un formulario tras subir imagen (bajo volumen; limpieza futura opcional).

CAMBIOS DE chore/docker-deploy (rama en curso):
- Fix contacto: POST /contact devuelve 502 EMAIL_ERROR si el envío SMTP falla (antes daba 201 falso).
- Nuevo GET /api/v1/health/db (SELECT 1; 200/503) para monitorización y ping anti-pausa.
- Dockerización: Dockerfile (node:22-alpine + pnpm 9 + prisma generate, no-root), docker-entrypoint.sh (migrate deploy + start) y render.yaml (Blueprint Render, free, rama main). Imagen verificada en local contra la BD del compose (health, health/db y collections OK).
- scripts/bootstrap-admin.js: primer ADMIN de producción vía env (ADMIN_EMAIL/ADMIN_PASS fuerte, upsert, sin secretos en logs). NO ejecutar prisma db seed en prod.
- docs/DEPLOY.md: guía Render + Supabase (URLs de conexión, env checklist, bootstrap, cron-job.org ping cada 10 min a /health/db, ciclo develop→main).
- DESPLIEGUE REALIZADO (2026-09-22): main = 789aa43. Render: https://portfolio-api-tjjy.onrender.com (Live). Supabase: proyecto joyqlaouwxlhwewuyqmr (Frankfurt), migraciones aplicadas vía entrypoint. Verificado: /health y /health/db 200, listados públicos 200 vacíos, login admin OK, bootstrap-admin ejecutado (admin id=1 hectortello@mac.com). .gitignore añade .env.prod (archivo de secretos temporal, ya borrado).
- PENDIENTES manuales: CLOUDINARY_URL en Render (upload devuelve 500 hasta configurarla); cambiar ADMIN_PASS expuesta en chat (PUT /admin/users/1/password); ping cron-job.org cada 10 min a /health/db; región Render → Frankfurt; SMTP real (contacto da 502); CORS_ORIGIN cuando exista el front; Postman baseUrl prod (aplazado por el usuario).

REGLAS DE SESIÓN (ESTRICTAS):
1. Verificar siempre la rama antes de trabajar (`hu/XX-nombre`). NUNCA escribir código directo en `develop`.
2. Seguir TDD estricto (RED → GREEN → REFACTOR) y mantener 100% de cobertura.
3. DETENERSE y pedir aprobación antes de escribir o modificar código en el proyecto.
4. NUNCA ejecutar comandos de Git (commit/push/merge/delete) sin confirmación explícita del usuario.
5. NO escanear la base de código entera ni abrir SESION.md por iniciativa propia durante la sesión.

¿Qué Historia de Usuario abordamos hoy?
```

## Instrucciones de Mantenimiento

   - Al finalizar cada HU (Paso 6 de AGENTS.md), actualiza los checks de la sección ESTADO DE LAS HUS POR FASE en este archivo.

   - Al iniciar un chat nuevo, simplemente copia el bloque de texto superior y pégalo.
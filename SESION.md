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
- DESPLIEGUE REALIZADO (2026-09-22): main = ccb1a1c. Render: https://portfolio-api-u5sx.onrender.com (Live, región Frankfurt vía render.yaml). Supabase: proyecto joyqlaouwxlhwewuyqmr (Frankfurt), migraciones aplicadas vía entrypoint. Admin prod: id=1 hectortello@mac.com (bootstrap-admin).
- VERIFICADO en prod (2026-09-22): /health y /health/db 200 con latencias 80-130ms (Frankfurt confirmado); login admin OK; GET /admin/users OK; POST /admin/upload OK (Cloudinary dclv58msd); POST /contact 502 EMAIL_ERROR esperado sin SMTP. Nota: PNGs de prueba 1x1 huérfanos en Cloudinary (carpeta general), borrables.
- HECHOS manuales (2026-09-22): servicio viejo de Oregon borrado (404 verificado); cron-job.org activo con ping cada 10 min a /health/db.
- PENDIENTES manuales: ROTAR ADMIN_PASS — SIGUE ACTIVA la expuesta en chat (verificado: login con la clave antigua aún devuelve token); vía PUT /admin/users/1/password o reejecutar bootstrap-admin. SMTP real (contacto da 502 hasta configurarlo); CORS_ORIGIN cuando exista el front; Postman baseUrl prod (aplazado); crear contenido real (colecciones/pinturas/biografía).

CAMBIOS DE feat/password-reset (rama en curso):
- Recuperación de contraseña auto-servicio: POST /auth/forgot-password (200 genérico + email con token de 1 uso, hash SHA-256 en BD, expiración 1 h) y POST /auth/reset-password (valida token, bcrypt 12, consume token). Rate limit 5/15 min en ambos.
- Prisma: passwordResetToken/passwordResetExpires en User (migración add_password_reset_fields, aplicada en local; pendiente en prod vía deploy).
- Nueva env FRONTEND_URL (base del enlace de recuperación; fallback http://localhost:5173). Añadida a .env.example, render.yaml y DEPLOY.md — HAY QUE RELLENARLA en Render al desplegar.
- Sin SMTP configurado el flujo responde 200 pero el email no se entrega (log de error).

CAMBIOS DE feat/resend-email + fix/smtp-timeouts (mergeados a develop/main):
- Render free bloquea SMTP saliente (25/465/587) desde sep-2025 → Gmail SMTP inviable en prod (diagnosticado con "Connection timeout" en logs).
- src/services/email.js: doble vía — Resend (API HTTPS) si RESEND_API_KEY definida; SMTP Nodemailer como fallback local. Timeout 15s (AbortSignal) + timeouts SMTP 10-30s y secure automático en puerto 465. Nuevas envs RESEND_API_KEY y EMAIL_FROM (.env.example, render.yaml, DEPLOY.md actualizados).
- VERIFICADO en prod: POST /contact → 201 vía Resend (email entregado en el Gmail del admin). Cuenta Resend creada con infotelloweb@gmail.com.

CAMBIOS DE feat/exhibition-images (mergeado a develop):
- Requisito previo del front (Fase 13 client): exposiciones con subida MÚLTIPLE de imágenes. Diseño aprobado "Opción A" (images como array en el JSON, sin endpoints nuevos; reutiliza el flujo en 2 pasos POST /admin/upload → url).
- Prisma: nuevo modelo ExhibitionImage (url, thumbnail?, width?, height?, position; relación 1-N con Exhibition onDelete Cascade; índice por exhibitionId). Migración add_exhibition_images (aplicada en local; PENDIENTE en prod vía migrate deploy al desplegar).
- POST /admin/exhibitions acepta images:[{url,thumbnail?,width?,height?}] y las crea anidadas (el orden del array = position). PUT /admin/exhibitions/:id con images REEMPLAZA la lista en transacción atómica (update+deleteMany+createMany+recarga); [] la limpia; omitido no la toca. GET público y admin serializan images ordenadas.
- Validación Joi imagesField() (src/middleware/validate.js) en exhibitionSchema y exhibitionUpdateSchema: url URI obligatoria, thumbnail/width/height opcionales null, máx 50.
- Docs sincronizadas: openapi.yaml (schemas ExhibitionImage + ExhibitionImageInput + campo images en Exhibition y ExhibitionRequest), openapi-INDEX.md regenerado (paths +57 líneas, total 2206), colección Postman (bodies + descriptions de POST/PUT exhibitions) y CHANGELOG [Unreleased].
- Tests: 466 en total (antes 449), cobertura 100%, lint 0 errores.
- Nota: archivos huérfanos en Cloudinary al borrar/sustituir imágenes (sin endpoint de borrado; riesgo ya aceptado, ver bloque fix/endpoints).

CIERRE DEL BACKEND (2026-09-22):
- Estado final: develop dd65257+ / main desplegado en https://portfolio-api-u5sx.onrender.com (Frankfurt) + Supabase joyqlaouwxlhwewuyqmr (Frankfurt) + Cloudinary dclv58msd + Resend + cron-job.org ping /health/db cada 10 min. 439 tests, lint 0 errores, cobertura 100%, CI verde. Docs (openapi/INDEX/Postman/CHANGELOG/DEPLOY) sincronizadas.
- PENDIENTES que hereda la fase de front:
  1. Alinear email del admin en BD prod (hectortello@mac.com → infotelloweb@gmail.com) vía login + PUT /admin/users/1; luego probar POST /auth/forgot-password end-to-end (el email de reset debe llegar al Gmail). Sin esto, la recuperación no entrega emails (Resend sin dominio verificado solo envía a la dirección de su cuenta).
  2. Rotar ADMIN_PASS (quedó expuesta en el chat de la sesión).
  3. Postman: baseUrl → https://portfolio-api-u5sx.onrender.com/api/v1 (CURRENT VALUE) y reimportar colección (incluye forgot/reset-password, health/db, reorders design/illustrations).
  4. Crear contenido real en prod (colecciones → pinturas → diseño/ilustraciones → biografía) para que el front tenga datos.
  5. Al desplegar el front: CORS_ORIGIN y FRONTEND_URL reales en Render; dominio propio → verificar en Resend y cambiar EMAIL_FROM (permite enviar a cualquier usuario).
  6. Frontend: Fase 7 (HU17 galería pública + HU18 panel admin); convención acordada: raw JSON siempre + subida de imágenes vía POST /admin/upload (ver bloque "Decisión de diseño: Front ↔ Back").

PENDIENTE DEL SERVER (2026-09-25, detectado en la Fase 15 del front — refactor admin):
- openapi.yaml documenta los POST/PUT de paintings/design/illustrations SOLO como multipart/form-data con campo binario `image`. La convención acordada (raw JSON + subida en 2 pasos) hace que el front envíe `imageUrl` (obtenida de POST /admin/upload) en el JSON del create/update; el server lo acepta y funciona (verificado con E2E Playwright del front contra server real), pero esa variante NO está documentada en el contrato.
- Acción propuesta: documentar la variante application/json con `imageUrl` (string, format uri) en PaintingRequest/PaintingUpdateRequest/DesignRequest/IllustrationRequest (o en el requestBody de sus endpoints POST/PUT) y regenerar openapi-INDEX.md. El front no necesita cambios.

CAMBIOS DE fix/23-cloudinary-image-deletion (2026-09-26):
- Las eliminaciones y reemplazos de pinturas, proyectos de diseño, ilustraciones, colecciones, exposiciones y biografía limpian sus imágenes de Cloudinary cuando corresponda.
- Se almacenan identificadores `publicId` con fallback para URLs legacy; las URLs externas no se eliminan.
- Nueva migración `add_cloudinary_public_ids` y servicio `src/services/cloudinary.js`.
- Verificado: 500 tests, lint correcto y cobertura 100%. Migración pendiente de aplicar en entornos con PostgreSQL disponible.

CAMBIOS DE fix/24-cloudinary-public-id (2026-09-26):
- Las subidas persisten el `public_id` real devuelto por Cloudinary en pinturas.
- `destroy` especifica `resource_type: image`; las respuestas `not found` se tratan como borrado idempotente.
- Verificación local: migración aplicada en PostgreSQL, health DB OK y tests de integración de HU06/HU10 OK.

CAMBIOS DE fix/25-cloudinary-public-id-all-resources (2026-09-26):
- Ilustraciones, proyectos de diseño y biografía persisten el `public_id` real de las subidas, manteniendo fallback para URLs Cloudinary legacy.
- El resultado `not found` de Cloudinary se trata como borrado idempotente; evita 500 aleatorios al eliminar recursos cuya imagen ya no existe.
- Colecciones y sus pinturas quedan cubiertas por el mismo comportamiento de borrado idempotente.
- Las actualizaciones que reciben `imageUrl: null` o vacío sin archivo devuelven `400 VALIDATION_ERROR`; no se intenta guardar `null` en campos de imagen obligatorios.
- `PUT /admin/biography` usa validación parcial: permite cambiar solo la imagen y conserva el contenido existente; `POST` mantiene `content` obligatorio.

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

# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adherido al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Changed (email vía Resend)
- `src/services/email.js` soporta dos vías de envío: **Resend (API HTTPS)** cuando `RESEND_API_KEY` está definida, y **SMTP (Nodemailer)** como fallback para desarrollo local. Motivo: Render bloquea el tráfico saliente a puertos SMTP (25/465/587) en instancias free desde 2025-09-26, por lo que Gmail SMTP era inviable en producción. Nuevas env vars `RESEND_API_KEY` y `EMAIL_FROM` (remite por defecto `onboarding@resend.dev`); actualizados `.env.example`, `render.yaml` y `docs/DEPLOY.md`. Timeout de 15 s en la llamada HTTP (`AbortSignal.timeout`). Errores de Resend propagan su mensaje (`detail.message` o `Resend respondió <status>`). Tests: +6 casos (ruta Resend, EMAIL_FROM, reply_to, errores HTTP/no-JSON/red); 439 en total.

### Added (recuperación de contraseña)
- Flujo completo de recuperación de contraseña (auto-servicio):
  - `POST /api/v1/auth/forgot-password`: responde siempre 200 genérico (no revela si el email existe, OWASP); si existe, genera token de un solo uso (64 hex, `crypto.randomBytes`), persiste solo su hash SHA-256 con expiración de 1 h (`RESET_TOKEN_EXPIRES_MINUTES`) y envía email con enlace `${FRONTEND_URL}/reset-password?token=...`. Rate limit 5/15 min.
  - `POST /api/v1/auth/reset-password`: valida hash+expiración, actualiza contraseña (bcrypt 12, política fuerte como register) y consume el token. 400 genérico "Token inválido o expirado". Rate limit 5/15 min.
  - Prisma: campos `passwordResetToken String? @unique` y `passwordResetExpires DateTime?` en `User` (migración `add_password_reset_fields`).
  - Nuevo `sendPasswordResetEmail` en `src/services/email.js`; constantes `FRONTEND_URL` (env con fallback localhost:5173) y `RESET_TOKEN_EXPIRES_MINUTES`; limiters `forgotPasswordLimiter`/`resetPasswordLimiter`; schemas Joi `forgotPasswordSchema`/`resetPasswordSchema`.
  - Sincronizados `docs/openapi.yaml` (+2 paths, +2 schemas), `docs/openapi-INDEX.md`, colección Postman (+2 requests), `.env.example`, `render.yaml` (`FRONTEND_URL`) y `docs/DEPLOY.md`.
  - Nota: la entrega real de emails depende de configurar `SMTP_*` (pendiente); sin SMTP, forgot-password responde 200 y registra el fallo de envío.

### Added (despliegue)
- `GET /api/v1/health/db`: health check de base de datos (`SELECT 1`; 200 `{status:'ok',db:'up'}` / 503 `SERVICE_UNAVAILABLE`). Nuevo `src/controllers/health.js`; pensado para monitorización y ping anti-pausa de free tiers. Sincronizados `docs/openapi.yaml`, `docs/openapi-INDEX.md`, colección Postman (+request) e INDEX.
- Dockerización: `Dockerfile` (node:22-alpine, pnpm 9, prisma generate, usuario no-root), `docker-entrypoint.sh` (`prisma migrate deploy` → `node src/app.js`) y `render.yaml` (Blueprint Render: web Docker free, rama `main`, healthcheck `/api/v1/health`, env vars con `sync:false` para secretos y `generateValue` para `JWT_SECRET`).
- `scripts/bootstrap-admin.js`: crea/promueve el primer ADMIN en producción vía upsert con `ADMIN_EMAIL`/`ADMIN_PASS` por env (política de contraseña fuerte; sin secretos en logs). Fuera de `src/`, no computa cobertura.
- `docs/DEPLOY.md`: guía completa de despliegue Render + Supabase (connection strings, env checklist, bootstrap admin, ping anti-pausa, ciclo de despliegue).

### Fixed
- `POST /contact` devolvía `201 "Mensaje enviado correctamente"` aunque el envío SMTP fallara (`sendContactEmail` retorna `{success:false}` sin lanzar excepción). Ahora responde `502 EMAIL_ERROR` "No se pudo enviar el mensaje. Inténtalo de nuevo más tarde" y registra el fallo con Winston.
- Transporter SMTP (`src/services/email.js`): timeouts explícitos (`connectionTimeout`/`greetingTimeout` 10 s, `socketTimeout` 30 s) y `secure` automático cuando `SMTP_PORT=465` (TLS implícito; 587 u otros usan STARTTLS). Antes, un SMTP inaccesible o configurado en 465 dejaba `POST /contact` y `POST /auth/forgot-password` colgados ~120 s (hasta el límite del proxy de Render) antes del 502; ahora fallan en ~10-30 s.

### Added
- Listados admin sin filtro de publicación para que el panel pueda mostrar y seleccionar cualquier elemento (publicado o no): `GET /admin/collections`, `GET /admin/paintings`, `GET /admin/exhibitions`, `GET /admin/design` y `GET /admin/illustrations`.
- Gestión de usuarios (Admin): `GET /admin/users` (paginación con `meta`), `GET /admin/users/:id`, `PUT /admin/users/:id`, `DELETE /admin/users/:id` y `PUT /admin/users/:id/password`. Nuevo `src/controllers/users.js`, `src/routes/users.js`, schemas `userUpdateSchema`/`passwordResetSchema` y helper `sendPaginated`.
- `GET /paintings` público: lista todas las pinturas publicadas (ordenadas por posición, incluyendo colección).
- `GET /design/featured` y `GET /illustrations/featured`: listan proyectos/ilustraciones destacados y publicados para la portada de sección.
- `POST /admin/biography`: crea la biografía con subida de imagen (multipart, campo `image`); devuelve 400 si ya existe una.
- Reordenamiento de diseño e ilustraciones: campo `position Int @default(0)` en `DesignProject` e `Illustration` (migración `add_position_design_illustration`, seed con posiciones iniciales) y nuevos endpoints `PUT /admin/design/reorder` y `PUT /admin/illustrations/reorder` (body `ReorderRequest`; 400 si algún ID no existe). Los listados (`GET /design`, `GET /design/featured`, `GET /illustrations`, `GET /illustrations/featured`, `GET /admin/design`, `GET /admin/illustrations`) ordenan ahora por `position asc`. Sincronizados `docs/openapi.yaml` (+`position` en schemas `DesignProject`/`Illustration`), `docs/openapi-INDEX.md`, colección Postman (+2 requests) y su INDEX.

### Changed
- Modelo de publicación/destacado unificado:
  - `isPublished` añadido a Exhibition, DesignProject e Illustration; `isFeatured` añadido a DesignProject e Illustration (migración `add_publish_featured_flags`).
  - `create`/`update` de pinturas, exposiciones, diseño e ilustraciones aceptan `isPublished` (y `isFeatured` donde aplica) en el body.
  - Los listados públicos (`GET /exhibitions`, `GET /design`, `GET /illustrations`) filtran `isPublished: true`.
- Biografía: `PUT /admin/biography` ahora es solo actualización (404 si no existe) y acepta imagen (multipart); si no se envía imagen, preserva la existente.
- `GET /design` (público): `subcategory` pasa a ser obligatorio; sin el parámetro devuelve `400 VALIDATION_ERROR` ("La subcategoría es obligatoria"). Se elimina el listado público "todas" (el admin sigue usando `GET /admin/design` sin filtros). Sincronizados `docs/openapi.yaml` (parámetro `required: true` + respuesta 400), `docs/openapi-INDEX.md` y la colección Postman (request renombrado a "GET /design (sin subcategoría → 400)").
- `POST /admin/paintings`: `year` pasa a ser obligatorio (`400 VALIDATION_ERROR` "El año es obligatorio" si falta o llega vacío por form-data). `PUT /admin/paintings/:id` sigue siendo actualización parcial (`year` opcional). Sincronizado `docs/openapi.yaml`: `PaintingRequest.required` incluye `year` (con rango 1900-2100) y nuevo schema `PaintingUpdateRequest` (sin campos requeridos, `minProperties: 1`) referenciado por el PUT; regenerado `docs/openapi-INDEX.md`.

### Removed
- Toggles `PUT /admin/paintings/:id/feature` y `PUT /admin/paintings/:id/publish`; la publicación/destacado se gestiona ahora exclusivamente vía campo en el body de `create`/`update`.
- `GET /admin/biography` (redundante con el público `GET /biography`).

### Changed
- Refactor de controladores para eliminar duplicación:
  - Nuevo `src/lib/http-response.js` con helpers `sendSuccess`, `sendError`, `sendNotFound`, `sendDuplicate` y `sendInternalError`; sustituye los bloques repetidos de respuesta/error en los 9 controladores.
  - `src/middleware/validate.js`: campos Joi reutilizables extraídos (`emailField`, `passwordField`, `titleField`, `imageUrlField`, `optionalTextField`, `subcategoryField`, `dateField`).
  - `src/middleware/rateLimiter.js`: añadido `loginLimiter`/`createLoginLimiter`; `src/app.js` lo importa en lugar de definirlo inline.
  - JSDoc homogeneizado (`@fileoverview`, `@module`, `@param`, `@returns`, `@security`) en los controladores que no lo tenían.
- Registro de administradores: la contraseña ahora debe incluir al menos una letra mayúscula y un símbolo (además del mínimo de 8 caracteres). Solo se aplica al registro (`registerSchema`); el login mantiene únicamente el mínimo de 8. Sincronizado `docs/openapi.yaml` (`RegisterRequest.password`).
- Seed (`prisma/seed.js`): la contraseña del admin pasa a cumplir la política fuerte (`Admin123!`). Sincronizados los ejemplos de login en la colección Postman, `docs/0001-API-DESIGN.md`, `docs/0002-IMPLEMENTATION-ORDER.md` y `skills/endpoint-tester/SKILL.md`.

### Added (docs tooling)
- Índices ligeros `docs/openapi-INDEX.md` y `docs/postman/INDEX.md` (mapa de endpoints con nº de línea / comando jq) y sección "Eficiencia de Tokens" en `AGENTS.md`.

### Fixed
- Tests de integración flaky (`hu-06`, `hu-10`, `hu-13`, `hu-16`): fallos intermitentes (404/400/429) en suite completa causados por el `AsyncLocalStorage`/OpenTelemetry de `@sentry/node`, que cruzaba contexto entre requests de supertest. Ahora `src/services/sentry.js` carga el SDK de forma perezosa (`await import` solo si `SENTRY_DSN` está definido), evitando su maquinaria en entornos sin DSN (local, tests, CI).
- Test unitario de rate limiting (`src/middleware/rateLimiter.test.js`): reemplazado `setTimeout` real por `vi.useFakeTimers()` + `advanceTimersByTime()` para eliminar dependencia de tiempo real.
- `POST/PUT /admin/collections` ignoraban `position` e `isPublished` (el schema Joi con `stripUnknown` los descartaba y el controller no los persistía), por lo que las colecciones creadas a mano quedaban sin publicar. Ahora `collectionSchema` los valida y `create`/`update` los persisten.
- `POST/PUT /admin/exhibitions` ignoraban `position`. Ahora `exhibitionSchema`/`exhibitionUpdateSchema` lo validan y `create`/`update` lo persisten.
- `PUT /admin/{collections,paintings,exhibitions}/reorder` devolvían `500` cuando `orderedIds` contenía un ID inexistente; ahora devuelven `400 VALIDATION_ERROR` ("Uno o más IDs no existen").
- Colección Postman: script de login ahora guarda el token en `environment` o `collection` según exista; `PUT /admin/biography` incluye `Content-Type: application/json`; contraseña de ejemplo de registro ajustada a la política de complejidad.
- Colección Postman: los 5 requests con campo de archivo vacío (`POST /admin/upload` ×3, `POST/PUT /admin/biography`) provocaban el error local de Postman `EISDIR: illegal operation on a directory, read` al pulsar Send sin seleccionar archivo (la petición nunca salía hacia el servidor). Las filas de archivo ahora se importan deshabilitadas con descripción (habilitar y elegir archivo real para subir); en biografía se añade campo de texto `imageUrl` como alternativa recomendada. La validación del servidor ya respondía correctamente cuando la petición llegaba (`400 "No se proporcionó archivo"`).
- CI (GitHub Actions) fallaba en todos los merges a `develop` desde que se activaron los umbrales de cobertura 100%: en CI `JWT_SECRET` está definido (ci.yml), por lo que la rama fallback de `src/lib/constants.js` (`process.env.JWT_SECRET || 'default'`) nunca se evaluaba y la cobertura global de ramas quedaba en 99.69%. Añadido `src/lib/constants.test.js` que cubre ambas ramas con `vi.stubEnv` + `vi.resetModules` + import dinámico; la cobertura es 100% con y sin la variable de entorno definida.
- Campos numéricos/booleanos/fecha rechazaban el string vacío con `400 VALIDATION_ERROR` al enviar `multipart/form-data` con campos opcionales en blanco (p. ej. `year: ''` en `POST/PUT /admin/paintings` devolvía `"year" must be a number`). Ahora los schemas Joi los tratan como no enviados (`.empty('')`): `year`, `position`, `collectionId`, `isPublished`/`isFeatured` y `date`. Nuevos helpers `positionField()`/`yearField()` en `src/middleware/validate.js` (eliminan la duplicación de `position` en 3 schemas). En schemas de actualización (`.min(1)`), un body con solo campos vacíos devuelve "Debe enviar al menos un campo para actualizar".

## [0.3.0] - 2026-09-21

### Added
- Observabilidad con Sentry (`@sentry/node`): monitoreo de errores y trazas opcional vía `SENTRY_DSN`
  - Servicio `src/services/sentry.js`: inicializa el SDK solo si `SENTRY_DSN` está definido, con `expressIntegration()`, `tracesSampleRate: 1.0`, `environment` (`NODE_ENV` o `development`) y `release` (`SENTRY_RELEASE`)
  - Import de inicialización al inicio de `src/app.js` (antes que `express` para correcta auto-instrumentación) y wiring de `Sentry.setupExpressErrorHandler(app)` para capturar errores no manejados
  - Test unitario: `src/services/sentry.test.js` (3 tests: init con DSN+release, fallback de environment, sin DSN)
- HU13: Formulario de Contacto (POST /api/v1/contact)
  - Controller: `send` en `src/controllers/contact.js` (envía email y retorna 201)
  - Ruta pública `POST /` con `contactLimiter` + `validate(contactSchema)` en `src/routes/contact.js`
  - Test de integración: `tests/integration/hu-13-contact-form.test.js` (6 tests)
- HU14: Servicio de Email
  - `sendContactEmail` en `src/services/email.js` (Nodemailer SMTP, HTML escapado contra inyección)
  - Test unitario: `src/services/email.test.js` (3 tests)
- HU15: Rate Limiting (Anti-Spam)
  - `contactLimiter` (5 req/min) en `src/middleware/rateLimiter.js`
  - Test unitario: `src/middleware/rateLimiter.test.js` (3 tests)
- Tests unitarios para controllers admin: `design.js`, `illustrations.js`, `exhibitions.js`, `paintings.js`, `collections.js`
- Test unitario para `src/controllers/biography.js` (get y createOrUpdate con/sin imageUrl)
- Test unitario para `src/lib/prisma-utils.js`
- Test unitario para `resolveImageUrl` en `src/services/upload.test.js`
- Test unitario para `src/services/logger.js` (formateo con/sin metadata)
- HU01: Galería de Colecciones (GET /api/v1/collections)
  - Controller: `listPublished` en `src/controllers/collections.js` (filtra publicadas, ordena por position, cuenta solo pinturas publicadas)
  - Router público `publicRouter` en `src/routes/collections.js`
  - Test unitario: `src/controllers/collections.test.js` (4 tests)
  - Test de integración: `tests/integration/hu-01-gallery.test.js` (3 tests)
- HU02: Detalle de Colección (GET /api/v1/collections/:id)
  - Controller: `getById` en `src/controllers/collections.js` (incluye pinturas ordenadas por position, 404 si no existe)
  - Ruta pública `publicRouter.get('/:id')` en `src/routes/collections.js`
  - Test de integración: `tests/integration/hu-02-collection-detail.test.js` (3 tests)
- HU03: Ficha de Pintura (GET /api/v1/paintings/:id)
  - Controller: `getById` en `src/controllers/paintings.js` (incluye colección `{ id, title }`, 404 si no existe)
  - Ruta pública `publicRouter.get('/:id')` en `src/routes/paintings.js` montada en `src/routes/index.js`
  - Test de integración: `tests/integration/hu-03-painting-card.test.js` (3 tests)
  - Tests unitarios: `getById` en `src/controllers/paintings.test.js` (3 tests)
- HU04: Obras Destacadas (GET /api/v1/paintings/featured)
  - Controller: `getFeatured` en `src/controllers/paintings.js` (filtra `isFeatured` y `isPublished`, incluye colección)
  - Ruta pública `publicRouter.get('/featured')` en `src/routes/paintings.js` (antes de `/:id`)
  - Test de integración: `tests/integration/hu-04-featured-lightbox.test.js` (3 tests)
  - Tests unitarios: `getFeatured` en `src/controllers/paintings.test.js` (3 tests)
- HU05: Exposiciones (GET /api/v1/exhibitions)
  - Controller: `listAll` en `src/controllers/exhibitions.js` (ordenadas por position)
  - Ruta pública `publicRouter.get('/')` en `src/routes/exhibitions.js` montada en `src/routes/index.js`
  - Test de integración: `tests/integration/hu-05-exhibitions.test.js` (3 tests)
  - Tests unitarios: `listAll` en `src/controllers/exhibitions.test.js` (3 tests)
- HU08: Filtrar Diseño (GET /api/v1/design)
  - Controller: `listFiltered` en `src/controllers/design.js` (filtra por subcategoría opcional)
  - Ruta pública `publicRouter.get('/')` en `src/routes/design.js` montada en `src/routes/index.js`
  - Test de integración: `tests/integration/hu-08-design-filter.test.js` (4 tests)
  - Tests unitarios: `listFiltered` en `src/controllers/design.test.js` (4 tests)
- HU09: Galería Ilustración (GET /api/v1/illustrations)
  - Controller: `listAll` en `src/controllers/illustrations.js`
  - Ruta pública `publicRouter.get('/')` en `src/routes/illustrations.js` montada en `src/routes/index.js`
  - Test de integración: `tests/integration/hu-09-illustration-gallery.test.js` (3 tests)
  - Tests unitarios: `listAll` en `src/controllers/illustrations.test.js` (3 tests)
- HU11: Leer Biografía (GET /api/v1/biography)
  - Ruta pública `publicRouter.get('/')` en `src/routes/biography.js` montada en `src/routes/index.js`
  - Test de integración: `tests/integration/hu-11-biography.test.js` (3 tests)
- Skill `endpoint-tester` para testing de endpoints en 2 fases (exploración + formalización)
- Test de consistencia `tests/docs/openapi-consistency.test.js` que verifica que todas las rutas implementadas están documentadas en `openapi.yaml` y que el enum `DesignSubcategory` coincide con `prisma/schema.prisma`
- Enum `DesignSubcategory` para subcategorías de diseño (IMAGEN_CORPORATIVA, PACKAGING_EXPOSITORES, CARTELERIA, EDITORIAL)
- HU06: Admin Colecciones y Pinturas (10 endpoints admin CRUD)
  - Controllers: `src/controllers/collections.js`, `src/controllers/paintings.js`
  - Routes: `src/routes/collections.js`, `src/routes/paintings.js`
  - Tests de integración: `tests/integration/hu-06-admin-collections.test.js` (34 tests)
  - Schema `paintingUpdateSchema` para updates parciales
- HU07: Admin Exposiciones (4 endpoints admin CRUD)
  - Controller: `src/controllers/exhibitions.js`
  - Routes: `src/routes/exhibitions.js`
  - Tests de integración: `tests/integration/hu-07-admin-exhibitions.test.js` (13 tests)
  - Schema `exhibitionUpdateSchema` para updates parciales
- HU10: Admin Diseño e Ilustraciones (6 endpoints admin CRUD)
  - Controllers: `src/controllers/design.js`, `src/controllers/illustrations.js`
  - Routes: `src/routes/design.js`, `src/routes/illustrations.js`
  - Tests de integración: `tests/integration/hu-10-admin-design.test.js` (30 tests)
  - Schemas `designUpdateSchema`, `illustrationUpdateSchema` para updates parciales
- HU12: Admin Biografía (2 endpoints admin)
  - Controller: `src/controllers/biography.js`
  - Routes: `src/routes/biography.js`
  - Tests de integración: `tests/integration/hu-12-admin-biography.test.js` (9 tests)
- Prisma singleton (`src/lib/prisma.js`) para evitar múltiples conexiones
- 10 Joi schemas en `src/middleware/validate.js` (collection, painting, exhibition, design, illustration, biography, contact, reorder)
- Test helper para Prisma mock con 7 models (`tests/helpers/prisma-mock.js`)
- Tests de integración para HU19 (health check) en `tests/integration/`
- Test para fileFilter de Multer (tipos MIME permitidos/rechazados)
- Sección de patrones de implementación en `docs/0002-IMPLEMENTATION-ORDER.md` (Prisma singleton, error handling, reorder, tests, Joi schemas)

### Changed
- Subcategorías de diseño en kebab-case (`imagen-corporativa`, `packaging-expositores`, `carteleria`, `editorial`): `DesignProject.subcategory` pasa de enum `DesignSubcategory` a `String` (Prisma no admite guiones en valores de enum) y se elimina el campo redundante `category`. Migración `drop_design_category_kebab_subcategory`. Validación vía `DESIGN_SUBCATEGORIES` en `constants.js`.
- Refactor: extraídos helpers compartidos de Prisma en `src/lib/prisma-utils.js` (`parseId`, `isNotFoundError`, `isDuplicateError`, `reorderByPosition`)
- Refactor: extraída resolución de imagen (`resolveImageUrl`) en `src/services/upload.js` para pinturas, diseño e ilustraciones
- Refactor: estandarizada detección de errores Prisma por código (`P2025`/`P2002`) en lugar de `error.message.includes(...)` en todos los controladores admin
- HU12: `createOrUpdate` de biografía ahora persiste `imageUrl`
- `src/routes/index.js`: Montado router público de colecciones en `/api/v1/collections`
- `docs/0002-IMPLEMENTATION-ORDER.md`: Reescrito con detalle completo por HU (Prisma models, archivos, test cases, controller logic)
- `src/controllers/auth.js`: Usa Prisma singleton en vez de `new PrismaClient()`
- `src/routes/admin.js`: Agregadas rutas de collections y paintings
- `src/services/upload.js`: fileFilter extraído como función testable
- `tests/health.test.js`: Movido a `tests/integration/hu-19-health-check.test.js`
- `skills/hu-scaffold/SKILL.md`: Actualizado para usar Prisma singleton y prisma-mock helper
- `vitest.config.js`: Excluye `src/app.js` de coverage, threshold branches ajustado a 94%

### Fixed
- Schemas de actualización (`paintingUpdateSchema`, `exhibitionUpdateSchema`, `designUpdateSchema`, `illustrationUpdateSchema`): enviar body vacío devolvía el mensaje en inglés `"value" must have at least 1 key`. Ahora devuelve `"Debe enviar al menos un campo para actualizar"`.
- HU08: `GET /api/v1/design?subcategory=<valor_no_en_enum>` retornaba `500 INTERNAL_ERROR` (Prisma validation). Ahora valida contra `DESIGN_SUBCATEGORIES` y devuelve `404` con `"Subcategoría inválida"`.
- HU06: Validación de `collectionId` inexistente al crear pintura (retorna 404 NOT_FOUND en vez de 500)
- HU06: DELETE colección/pintura inexistente usa error code P2025 en vez de message matching
- HU10: Test de validación de categoría faltante en POST /admin/design
- Typo `CARTERERIA` → `CARTELERIA` en enum `DesignSubcategory` (Prisma, Joi, seed, tests) con migración `fix_design_subcategory_typo`
- Sincronizado `docs/openapi.yaml`, `docs/0001-API-DESIGN.md` y colección Postman con la lógica actual (enum `DesignSubcategory` en SCREAMING_SNAKE_CASE y `/admin/biography` como GET + PUT JSON)
- HU16: Test "given no auth token" fallaba con "socket hang up" — cambiado `.attach()` por `.send({})` ya que el test de auth no necesita archivo real
- `.env.example`: Corregido puerto de DB (5432 → 5433) para coincidir con docker-compose.yml
- Eliminado `tests/dummy.test.js` (test placeholder sin valor)

### Removed
- `tests/dummy.test.js` (test placeholder)

## [0.2.0] - 2026-09-18

### Added
- HU19: Health Check (GET /api/v1/health)
- HU20: Login Admin (POST /api/v1/auth/login → JWT)
- HU21: Protección de Rutas (middleware JWT en /api/v1/admin/*)
- HU22: Registro Admin (POST /api/v1/admin/users/register → JWT Admin)
- Controller de autenticación con bcrypt + jsonwebtoken (`src/controllers/auth.js`)
- Rutas de autenticación (`src/routes/auth.js`)
- Rutas admin (`src/routes/admin.js`)
- Middleware de autenticación JWT (`src/middleware/auth.js`)
- Middleware de validación con Joi (`src/middleware/validate.js`)
- Constantes de configuración JWT y bcrypt (`src/lib/constants.js`)
- Cliente Prisma singleton (`src/lib/prisma.js`)
- Servicio de logging con Winston (`src/services/logger.js`)
- Rate limiting en login (10 req/min) via express-rate-limit
- Tests unitarios para auth controller
- Tests de integración para HU19, HU20, HU21, HU22
- Documentación JSDoc en todos los archivos fuente

### Fixed
- Corregido: documentación mencionaba Jest, ahora refleja Vitest (testing framework real)

### Security
- JWT authentication para rutas admin (HU20, HU21, HU22)
- Rate limiting en login (10 req/min) - previene fuerza bruta (OWASP A07)
- bcrypt con 12 rounds para hashing de contraseñas
- Validación de input con Joi en endpoints de autenticación
- helmet.js para headers de seguridad
- CORS configurable por variable de entorno
- Middleware de autorización por roles (ADMIN/USER)

## [0.1.0] - 2026-09-16

### Added
- Estructura inicial del proyecto
- Configuración de dependencias principales
- Schema de Prisma con modelos: User, Collection, Painting, Exhibition, DesignProject, Illustration, Biography
- Docker Compose para PostgreSQL 16
- Documentación completa del proyecto

### Notes
- Versión inicial en desarrollo
- Stack: Node.js + Express + Prisma + PostgreSQL + Vitest

[Unreleased]: https://github.com/tu-usuario/web-tello-2026/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/tu-usuario/web-tello-2026/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tu-usuario/web-tello-2026/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tu-usuario/web-tello-2026/releases/tag/v0.1.0

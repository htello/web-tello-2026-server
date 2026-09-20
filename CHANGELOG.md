# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adherido al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Fixed
- HU08: `GET /api/v1/design?subcategory=<valor_no_en_enum>` retornaba `500 INTERNAL_ERROR` (Prisma validation). Ahora valida contra `DESIGN_SUBCATEGORIES` y devuelve `404` con `"Subcategoría inválida"`.
- HU06: Validación de `collectionId` inexistente al crear pintura (retorna 404 NOT_FOUND en vez de 500)
- HU06: DELETE colección/pintura inexistente usa error code P2025 en vez de message matching
- HU10: Test de validación de categoría faltante en POST /admin/design
- Typo `CARTERERIA` → `CARTELERIA` en enum `DesignSubcategory` (Prisma, Joi, seed, tests) con migración `fix_design_subcategory_typo`
- Sincronizado `docs/openapi.yaml`, `docs/0001-API-DESIGN.md` y colección Postman con la lógica actual (enum `DesignSubcategory` en SCREAMING_SNAKE_CASE y `/admin/biography` como GET + PUT JSON)

### Added
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

[Unreleased]: https://github.com/tu-usuario/web-tello-2026/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tu-usuario/web-tello-2026/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tu-usuario/web-tello-2026/releases/tag/v0.1.0

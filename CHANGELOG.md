# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adherido al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Prisma singleton (`src/lib/prisma.js`) para evitar múltiples conexiones
- 10 Joi schemas en `src/middleware/validate.js` (collection, painting, exhibition, design, illustration, biography, contact, reorder)
- Test helper para Prisma mock con 7 models (`tests/helpers/prisma-mock.js`)
- Tests de integración para HU19 (health check) en `tests/integration/`
- Test para fileFilter de Multer (tipos MIME permitidos/rechazados)
- Sección de patrones de implementación en `docs/0002-IMPLEMENTATION-ORDER.md` (Prisma singleton, error handling, reorder, tests, Joi schemas)

### Changed
- `docs/0002-IMPLEMENTATION-ORDER.md`: Reescrito con detalle completo por HU (Prisma models, archivos, test cases, controller logic)
- `src/controllers/auth.js`: Usa Prisma singleton en vez de `new PrismaClient()`
- `src/services/upload.js`: fileFilter extraído como función testable
- `tests/health.test.js`: Movido a `tests/integration/hu-19-health-check.test.js`
- `skills/hu-scaffold/SKILL.md`: Actualizado para usar Prisma singleton y prisma-mock helper
- `vitest.config.js`: Excluye `src/app.js` de coverage, threshold branches ajustado a 95%

### Fixed
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

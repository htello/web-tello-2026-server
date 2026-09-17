# AGENTS.md

## Estado

- Runtime: Node.js >= 18
- Backend: Express (JavaScript puro)
- ORM: Prisma
- DB: PostgreSQL (Docker local)
- Testing: Vitest con 100% cobertura obligatoria
- Package Manager: pnpm
- CI/CD: GitHub Actions
- **API Design**: Ver `docs/openapi.yaml` para especificación OpenAPI 3.0.3

## Regla de Oro

> **NUNCA implementar código hasta que el usuario revise lo propuesto y dé explícitamente su aprobación.**

Flujo obligatorio:
1. Proponer solución (código, estructura, cambios)
2. **Mostrar el código completo** que se va a crear/modificar
3. Esperar aprobación explícita del usuario
4. Solo entonces implementar

**IMPORTANTE:** No solo mostrar el plan textual, sino **el código real** (syntax highlighting, archivos completos) antes de crearlos.

## Skills del Proyecto

Uso obligatorio de skills para mantener consistencia:

| Skill | Cuándo usar | Archivo |
|-------|-------------|---------|
| `tdd-enforcer` | Siempre que se escriba código nuevo | `skills/tdd-enforcer/SKILL.md` |
| `prisma-mock` | Al crear tests que usan base de datos | `skills/prisma-mock/SKILL.md` |
| `express-handler` | Al crear rutas, controladores o middleware | `skills/express-handler/SKILL.md` |
| `hu-scaffold` | Al empezar una nueva HU (HU01-HU21) | `skills/hu-scaffold/SKILL.md` |

### Flujo de Uso de Skills

```
Nueva tarea → hu-scaffold → tdd-enforcer → prisma-mock / express-handler
```

1. **hu-scaffold**: Crear test file y esqueleto de tests primero
2. **tdd-enforcer**: Asegurar ciclo RED-GREEN-REFACTOR
3. **prisma-mock**: Mockear Prisma correctamente si hay DB
4. **express-handler**: Crear rutas con patrones consistentes

## Reglas TDD (Estrictas)

1. **RED**: Escribir test fallido primero
2. **GREEN**: Código mínimo para pasar test
3. **REFACTOR**: Mejorar código solo cuando el test pase (verde)
4. No avanzar a siguiente HU sin 100% cobertura en la actual
5. Cada HU (HU01-HU21) debe tener su archivo de test dedicado

## Comandos

```bash
# Desarrollo
pnpm test                              # Ejecutar todos los tests
pnpm test src/controllers/collections  # Ejecutar tests de un archivo (TDD)
pnpm run test:watch                    # Modo watch (desarrollo)
pnpm run test:coverage                 # Verificar cobertura 100%
pnpm run lint                          # Verificar estilo de código (ESLint)

# Prisma
pnpm exec prisma migrate dev          # Crear migración
pnpm exec prisma generate             # Regenerar cliente Prisma
pnpm exec prisma db seed              # Poblar base de datos

# Docker
docker compose up -d                  # Levantar PostgreSQL
docker compose down                   # Detener PostgreSQL
```

## Estructura del Proyecto

```
server/
├── src/
│   ├── routes/              # Rutas Express (+ tests colocados)
│   ├── controllers/         # Lógica de negocio (+ tests colocados)
│   ├── middleware/          # Auth (JWT), validación, rate-limit (+ tests)
│   └── services/           # Email (Nodemailer), upload (Cloudinary), logger (Winston)
├── prisma/
│   ├── schema.prisma        # Esquema de base de datos
│   └── seed.js              # Datos de prueba
├── tests/
│   ├── integration/         # Tests de integración (supertest)
│   └── fixtures/            # Datos de prueba reutilizables
├── .opencode/
│   └── agents/              # Subagentes autónomos
│       ├── tdd-workflow.md
│       ├── security-audit.md
│       ├── docs-sync.md
│       └── prisma-validator.md
├── skills/                  # Skills del proyecto (TDD, Prisma, Express)
│   ├── tdd-enforcer/
│   ├── prisma-mock/
│   ├── express-handler/
│   └── hu-scaffold/
├── docs/
│   ├── openapi.yaml         # Especificación OpenAPI 3.0.3 (fuente de verdad)
│   ├── 0001-API-DESIGN.md   # Documento de diseño de API
│   └── 0002-IMPLEMENTATION-ORDER.md # Orden de implementación de HUs
├── docker-compose.yml       # PostgreSQL local
├── .env.example             # Variables de entorno (template)
├── package.json
├── pnpm-lock.yaml           # Lockfile de dependencias
├── vitest.config.js
├── README.md
├── CHANGELOG.md
└── AGENTS.md
```

### Pirámide de Tests

Cada HU debe tener **ambos tipos de test**:

```
        ╱╲
       ╱  ╲        E2E (pocos, lentos)
      ╱    ╲       → Cypress, Playwright (futuro)
     ╱──────╲
    ╱        ╲     Integración (moderados)
   ╱          ╲    → Supertest, HTTP requests
  ╱────────────╲
 ╱              ╲  Unitarios (muchos, rápidos)
╱                ╲ → Vitest, funciones aisladas
```

| Tipo | Qué prueba | Ubicación | Herramienta |
|------|------------|-----------|-------------|
| **Unit** | Función/método aislado | Al lado del archivo | Vitest |
| **Integración** | Endpoint HTTP completo | `tests/integration/` | Supertest |

**Regla:** Cada HU (HU01-HU21) debe tener:
1. Test unitario del controller/service (`src/controllers/xxx.test.js`)
2. Test de integración del endpoint (`tests/integration/hu-XX-xxx.test.js`)

### Convención de Tests

- **Tests unitarios**: Colocados al lado del archivo que testean
  ```
  src/controllers/collections.js
  src/controllers/collections.test.js    ← test unitario
  ```

- **Tests de integración**: En `tests/integration/`
  ```
  tests/integration/hu-06-admin-collections.test.js
  ```

- **Fixtures**: En `tests/fixtures/`
  ```
  tests/fixtures/collections.js
  ```

## Convenciones de Escritura

### 1. Funciones

```javascript
// ✅ SIEMPRE arrow functions
const getAll = async (req, res) => {...};
const validate = (schema) => (req, res, next) => {...};

// ❌ NUNCA function declarations
function getAll(req, res) {...}
```

### 2. Variables

```javascript
// ✅ SIEMPRE const (por defecto), let solo si se reasigna
const data = {};
let count = 0;

// ❌ NUNCA var
var data = {};
```

### 3. Async/Await

```javascript
// ✅ SIEMPRE async/await
const getAll = async (req, res) => {
  const items = await prisma.item.findMany();
};

// ❌ NUNCA .then() chains
prisma.item.findMany().then(items => {...});
```

### 4. Template Literals

```javascript
// ✅ SIEMPRE template literals
const msg = `Error: ${error.message}`;

// ❌ NUNCA concatenación
const msg = 'Error: ' + error.message;
```

### 5. Destructuring

```javascript
// ✅ SIEMPRE destructuring cuando sea claro
const { id, name } = req.body;
const { PrismaClient } = require('@prisma/client');

// ❌ Acceso directo cuando hay varios campos
const id = req.body.id;
const name = req.body.name;
```

### 6. Imports/Exports (ES Modules)

```javascript
// ✅ SIEMPRE import/export
import { getAll, create, update } from './controllers/collections.js';
export { getAll, create, update };

// ✅ Default export solo para clases principales
export default app;

// ❌ NUNCA CommonJS
const { getAll } = require('./controllers/collections.js');
module.exports = { getAll };
```

### 7. Naming Conventions

```javascript
// ✅ SIEMPRE
const collections = [];           // camelCase variables
const CollectionController = {};  // PascalCase clases/objetos grandes
const GET_ALL = 'GET_ALL';        // SCREAMING_SNAKE_CASE constantes
const getCollections = () => {};  // camelCase funciones con verbo

// ❌ NUNCA
const Collections = [];           // PascalCase para arrays
const getCollections = [];        // función declarada como variable sin función
```

## Convenciones de Testing

- Nombre: `describe('HU01 - Galería de Colecciones', () => {...})`
- Mockear Prisma con `vi.mock('@prisma/client')`
- Mockear servicios externos (Cloudinary, Nodemailer)
- Usar `supertest` para tests de integración de endpoints
- Cada test independiente, usar `beforeEach` para limpiar estado
- Fixtures en `tests/fixtures/` para datos reutilizables

## Mapeo HU → Tests

| Tipo de Test | Ubicación | Ejemplo |
|--------------|-----------|---------|
| Unit (controllers, services, middleware) | Colocado al lado del archivo | `src/controllers/collections.test.js` |
| Integration (endpoints) | `tests/integration/` | `tests/integration/hu-06-admin-collections.test.js` |

### Pirámide de Tests

```
        ╱╲
       ╱  ╲        E2E (pocos, lentos)
      ╱    ╲       → Cypress, Playwright (futuro)
     ╱──────╲
    ╱        ╲     Integración (moderados)
   ╱          ╲    → Supertest, HTTP requests
  ╱────────────╲
 ╱              ╲  Unitarios (muchos, rápidos)
╱                ╲ → Vitest, funciones aisladas
```

| Tipo | Qué prueba | Ubicación | Herramienta |
|------|------------|-----------|-------------|
| **Unit** | Función/método aislado | Al lado del archivo | Vitest |
| **Integración** | Endpoint HTTP completo | `tests/integration/` | Supertest |

**Regla:** Cada HU (HU01-HU21) debe tener:
1. Test unitario del controller/service (`src/controllers/xxx.test.js`)
2. Test de integración del endpoint (`tests/integration/hu-XX-xxx.test.js`)

## Setup Local (Primera Vez)

```bash
# 1. Levantar PostgreSQL
docker compose up -d

# 2. Instalar dependencias
pnpm install

# 3. Crear migración inicial
pnpm exec prisma migrate dev --name init

# 4. Poblar base de datos con datos de prueba
pnpm exec prisma db seed

# 5. Verificar que todo funciona
pnpm run test:coverage
```

## Orden de Implementación de HUs

Ver `docs/0002-IMPLEMENTATION-ORDER.md` para el diagrama completo de fases y dependencias.

**Resumen rápido:**
0. **Fase 0**: Setup del Proyecto (infraestructura base)
1. **Fase 1**: Auth + Infraestructura (HU20 → HU21 → HU19)
2. **Fase 2**: Upload (HU16)
3. **Fase 3**: Admin CRUD (HU06 → HU07 → HU10 → HU12)
4. **Fase 4**: Galería Pública (HU01 → HU02 → HU03 → HU04 → HU05)
5. **Fase 5**: Diseño e Ilustración (HU08 → HU09)
6. **Fase 6**: Resto Backend (HU11 → HU13 → HU14 → HU15)
7. **Fase 7**: Frontend-only (HU17 → HU18) — *Sin endpoint backend*

## Resumen de HUs

Ver `docs/0001-API-DESIGN.md` para detalles completos de cada HU, endpoints y modelos de datos.

## Convenciones de Git

### Branches

```
hu/01-gallery          # Nueva funcionalidad
hu/06-admin-collections
fix/13-contact-validation  # Arreglo de bug
chore/docker-setup         # Tareas de mantenimiento
refactor/auth-middleware    # Refactorización
```

### Commits (Conventional Commits)

```
feat(hu-01): add gallery endpoint
feat(hu-20): implement admin login
fix(hu-13): validate email format
test(hu-06): add collection CRUD tests
chore(docker): add postgres 16
refactor(auth): extract middleware
docs: update AGENTS.md
```

## Seguridad (OWASP Top 10:2025)

| OWASP | Categoría | Implementación Clave |
|-------|-----------|----------------------|
| A01 | Broken Access Control | JWT auth (HU20), route protection (HU21), CORS por env, rate limiting (5/10 req/min) |
| A02 | Security Misconfiguration | helmet.js, x-powered-by off, HTTPS en prod, no stack traces en HTTP, .env no commiteado |
| A03 | Supply Chain | `pnpm install --frozen-lockfile` en CI/CD, lockfile versionado, `pnpm audit`, `.npmrc` engine-strict |
| A04 | Cryptographic Failures | bcrypt 12 rounds, JWT secret ≥32 chars, no secrets en logs/responses, HTTPS prod |
| A05 | Injection | Prisma parameterized queries (no SQL concat), XSS sanitization, Joi/Zod validation |
| A06 | Insecure Design | Admin HUs requieren auth, least privilege (isPublished), validación server-side |
| A07 | Auth Failures | bcrypt 12, password ≥8 chars, account lockout (5 intentos), JWT expiration 24h, rate limit login |
| A08 | Data Integrity | `pnpm install --frozen-lockfile`, lockfile, no eval() en input no confiable |
| A09 | Logging Failures | Logear login/access denied/errors, no secrets en logs, JSON structured logging |
| A10 | Exception Handling | Try/catch en toda ruta, fail-closed en auth, error messages genéricos al cliente |

### Checklist de Seguridad (antes de cada PR)

```bash
- [ ] No hay secrets hardcoded (buscar con grep)
- [ ] No hay console.log con datos sensibles (usar logger)
- [ ] Logger no expone secrets en output
- [ ] Rutas admin usan middleware authenticate
- [ ] Input validado en todas las rutas POST/PUT
- [ ] helmet.js instalado y habilitado
- [ ] .env.example actualizado si se agregaron variables
- [ ] pnpm audit pasa sin vulnerabilidades críticas
```

## Logging y Monitoreo

### Librería: Winston

Los controllers y servicios deben usar el logger del proyecto:

```javascript
import logger from '../services/logger.js';

// En controllers
logger.info('Painting created', { id: painting.id, userId: req.user.id });
logger.error('Failed to create painting', { error: error.message });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

### Qué logear

| Nivel | Ejemplo |
|-------|---------|
| `error` | Errores de DB, fallos de email, excepciones |
| `warn` | Rate limit alcanzado, intento de acceso no autorizado |
| `info` | Login exitoso, CRUD operations, health check |

### Qué NO logear (OWASP A09)

- ❌ Passwords o tokens
- ❌ Datos sensibles del usuario (salvo ID para debugging)
- ❌ Secrets de environment
- ❌ Request bodies completos (pueden tener datos sensibles)

### Error Tracking: Sentry

Se agregará Sentry para captura de errores en desarrollo y producción.
DSN configurable via `SENTRY_DSN` env var.

### Producción (futura)

Cuando el proyecto se despliegue, agregar:
- APM (New Relic o Datadog)
- Metrics (Prometheus + Grafana)
- Uptime monitoring (Better Stack)

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Prisma no conecta a DB | `docker compose up -d` |
| Tests fallan con "cannot find module" | `pnpm exec prisma generate` |
| Puerto 5432 en uso | `lsof -i :5432` y matar el proceso |
| Migración no aplica | `pnpm exec prisma migrate reset --force` |
| Seed falla | Verificar que DB existe y migraciones están apply |
| "JWT_SECRET is not defined" | Crear archivo `.env` con las variables |

## Seed Data

El seed script (`prisma/seed.js`) crea:

- **1 usuario admin**: `admin@test.com` / `admin123`
- **3 colecciones**: "Óleos", "Acuarelas", "Esculturas"
- **10 pinturas**: Distribuidas en las colecciones
- **5 exposiciones**: Con fechas pasadas y futuras
- **3 proyectos de diseño**: Categorías variadas
- **5 ilustraciones**: Con imágenes de prueba

```bash
pnpm exec prisma db seed  # Ejecutar seed
```

## Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio_db

# Autenticación
JWT_SECRET=tu-clave-secreta-aqui

# Cloudinary (upload de imágenes)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Logging
LOG_LEVEL=info           # error, warn, info, debug

# Sentry (opcional en desarrollo)
SENTRY_DSN=https://...@sentry.io/...
```

## CI/CD (GitHub Actions)

Flujo obligatorio en cada PR:

1. Instalar dependencias
2. Ejecutar `pnpm exec prisma migrate deploy`
3. Ejecutar `pnpm run lint`
4. Ejecutar `pnpm run test:coverage`
5. Verificar cobertura >= 100%
6. Bloquear merge si falla cualquiera de los pasos

## Documentación

### Fuente de Verdad

La especificación OpenAPI 3.0.3 (`docs/openapi.yaml`) es la fuente de verdad de la API. Toda la documentación de endpoints, schemas y formatos de respuesta debe mantenerse sincronizada con este archivo.

### Archivos de Documentación

| Archivo | Contenido |
|---------|-----------|
| `docs/openapi.yaml` | Especificación OpenAPI 3.0.3 (fuente de verdad) |
| `docs/0001-API-DESIGN.md` | Documento de diseño de API con ejemplos |
| `docs/0002-IMPLEMENTATION-ORDER.md` | Orden de implementación de HUs y fases |
| `README.md` | Guía de inicio rápido y documentación general |
| `CHANGELOG.md` | Historial de cambios (Keep a Changelog) |
| `AGENTS.md` | Instrucciones para agentes de IA |

### Cómo Mantener la Documentación

1. **Al agregar un endpoint**: Actualizar `openapi.yaml` con el nuevo path, schema y respuesta
2. **Al modificar un schema**: Actualizar la definición en `components/schemas`
3. **Al cambiar comportamiento**: Actualizar la descripción del endpoint
4. **Al agregar variable de entorno**: Actualizar `README.md` y `.env.example`

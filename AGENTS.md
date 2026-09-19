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

## Reglas Críticas

> **NUNCA implementar código sin aprobación del usuario. NUNCA hacer commit/push sin confirmación explícita.**

- Proponer código completo antes de implementar
- No usar `git commit`, `git push`, `git merge` sin que el usuario diga "haz commit" o similar
- Flujo: cambios → tests + lint + coverage → esperar confirmación → git operations
- **NO son confirmación:** "ok", "vale", "perfecto", "bien", "sigue"
- **SÍ son confirmación:** "haz commit", "commit", "push", "sube", "guarda"

## Skills del Proyecto

Uso obligatorio de skills para mantener consistencia:

| Skill | Cuándo usar | Archivo |
|-------|-------------|---------|
| `tdd-enforcer` | Siempre que se escriba código nuevo | `skills/tdd-enforcer/SKILL.md` |
| `prisma-mock` | Al crear tests que usan base de datos | `skills/prisma-mock/SKILL.md` |
| `express-handler` | Al crear rutas, controladores o middleware | `skills/express-handler/SKILL.md` |
| `hu-scaffold` | Al empezar una nueva HU (HU01-HU22) | `skills/hu-scaffold/SKILL.md` |

### Flujo de Uso de Skills

```
Nueva tarea → hu-scaffold → tdd-enforcer → prisma-mock / express-handler
```

1. **hu-scaffold**: Crear test file y esqueleto de tests primero
2. **tdd-enforcer**: Asegurar ciclo RED-GREEN-REFACTOR
3. **prisma-mock**: Mockear Prisma correctamente si hay DB
4. **express-handler**: Crear rutas con patrones consistentes

## Reglas TDD (Estrictas)

Ver skill `tdd-enforcer` (`skills/tdd-enforcer/SKILL.md`) para el workflow completo.

Resumen: RED → GREEN → REFACTOR. 100% cobertura obligatoria. Cada HU debe tener su archivo de test dedicado.

## Comandos

```bash
pnpm test                          # Todos los tests
pnpm run test:coverage             # Cobertura 100%
pnpm run lint                      # ESLint
pnpm exec prisma migrate dev       # Migración
pnpm exec prisma generate          # Regenerar cliente
pnpm exec prisma db seed           # Seed data (ver prisma/seed.js)
docker compose up -d               # PostgreSQL
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

- **Funciones**: Arrow functions (`const fn = async () => {}`), nunca `function` declarations
- **Variables**: `const` por defecto, `let` solo si se reasigna, nunca `var`
- **Async/Await**: Siempre async/await, nunca `.then()` chains
- **Templates**: Siempre template literals, nunca concatenación `+`
- **Imports**: Siempre ES Modules (`import/export`), nunca CommonJS
- **Naming**: camelCase variables/funciones, PascalCase clases, SCREAMING_SNAKE_CASE constantes
- **JSDoc**: Todo archivo con `@fileoverview`, `@module`, `@param`, `@returns`, `@security`

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

**Regla:** Cada HU (HU01-HU22) debe tener:
1. Test unitario del controller/service (`src/controllers/xxx.test.js`)
2. Test de integración del endpoint (`tests/integration/hu-XX-xxx.test.js`)

## Configuración

- **DB/Seed/Setup**: Ver `README.md` → "Quick Start"
- **Variables de entorno**: Ver `.env.example`
- **Fases de implementación**: Ver `docs/0002-IMPLEMENTATION-ORDER.md`
- **Detalle de HUs**: Ver `docs/0001-API-DESIGN.md`

## Convenciones de Git

**Branches:** `hu/XX-nombre`, `fix/XX-nombre`, `chore/descripcion`, `refactor/descripcion`

**Commits:** Conventional Commits
```
feat(hu-01): add gallery endpoint
fix(hu-13): validate email format
test(hu-06): add collection CRUD tests
chore(docker): add postgres 16
```

**Workflow HU:**
1. `git checkout develop && git pull && git checkout -b hu/XX-nombre`
2. TDD: RED → GREEN → REFACTOR
3. `pnpm test && pnpm run lint && pnpm run test:coverage`
4. Esperar confirmación del usuario
5. `git add . && git commit -m "feat(hu-XX): descripcion"`
6. `git push origin hu/XX-nombre` → merge a develop con `--no-ff`
7. Actualizar CHANGELOG antes del commit

## CHANGELOG

Actualizar `CHANGELOG.md` en cada HU antes del commit.

- Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
- Secciones: `Added`, `Changed`, `Fixed`, `Security`, `Deprecated`, `Removed`
- No publicado en `[Unreleased]`
- Versionado semántico: MAJOR (breaking) / MINOR (nuevas HUs) / PATCH (fixes)

## Seguridad (OWASP)

Ver skills `security-audit` y `express-handler` para implementación.

**Checklist antes de cada PR:**
- No hay secrets hardcoded
- No hay `console.log` con datos sensibles
- Rutas admin usan middleware `authenticate`
- Input validado en POST/PUT
- `helmet.js` habilitado
- `.env.example` actualizado
- `pnpm audit` sin vulnerabilidades críticas

## Logging

Usar Winston (`src/services/logger.js`): `logger.info()`, `logger.error()`, `logger.warn()`.

**NO logear:** passwords, tokens, secrets, request bodies completos (OWASP A09).

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Prisma no conecta a DB | `docker compose up -d` |
| Tests fallan con "cannot find module" | `pnpm exec prisma generate` |
| Puerto 5432 en uso | `lsof -i :5432` y matar el proceso |
| Migración no aplica | `pnpm exec prisma migrate reset --force` |
| Seed falla | Verificar que DB existe y migraciones están apply |
| "JWT_SECRET is not defined" | Crear archivo `.env` con las variables |

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
| `SESION.md` | Prompt para reanudar sesiones con IA |

### Cómo Mantener la Documentación

1. **Al agregar un endpoint**: Actualizar `openapi.yaml` con el nuevo path, schema y respuesta
2. **Al modificar un schema**: Actualizar la definición en `components/schemas`
3. **Al cambiar comportamiento**: Actualizar la descripción del endpoint
4. **Al agregar variable de entorno**: Actualizar `README.md` y `.env.example`
5. **Al completar una HU o fase**: Actualizar `SESION.md` con el estado actual (fase completada, commit, branch)

### Actualización de SESION.md

`SESION.md` es el archivo que se usa para reanudar sesiones con IA. Debe mantenerse actualizado al final de cada HU completada:

- **Fase completada**: Marcar con ✅ la fase en el prompt
- **Nuevo commit**: Actualizar el hash del último commit
- **Nuevo branch**: Actualizar el nombre del branch activo
- **HU completada**: Mover la HU de ⏳ a ✅ en el estado de HUs
- **Nueva configuración**: Agregar variables o notas relevantes al prompt

```bash
# Para obtener el último commit:
git log -1 --format="%h"
```

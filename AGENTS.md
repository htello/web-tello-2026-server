
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

## Reglas Críticas (NO NEGOCIABLES)

> **NUNCA implementar código sin aprobación del usuario. NUNCA ejecutar comandos de Git (commit/push/merge/branch) sin confirmación explícita.**

1. **Aprobación de código**: Proponer el código completo en la conversación antes de escribirlo en los archivos.
2. **Uso estricto de ramas**: Antes de empezar cualquier HU, solicitar al usuario o verificar que se esté en la rama `hu/XX-nombre` (creada desde `develop`). No escribir nada directamente en `develop`.
3. **Confirmación de Git**:
   - **NO son confirmaciones:** "ok", "vale", "perfecto", "bien", "sigue".
   - **SÍ son confirmaciones:** "haz commit", "commit", "push", "sube", "guarda", "mergea", "haz merge".
4. **Flujo de parada**: Cambios → Tests + Lint + Coverage 100% → **DETENERSE Y ESPERAR CONFIRMACIÓN DEL USUARIO**.
5. **Inspección de archivos y Eficiencia de Tokens**:
   - **NUNCA leas el repositorio entero** por iniciativa propia.
   - **PROHIBIDO PRE-ESCANEAR:** NUNCA leas automáticamente `docs/`, carpetas de `postman`, `SESION.md` ni ejecutes `git log` al inicio de las peticiones.
   - **SOLICITUD DE CONFIRMACIÓN:** Si consideras IMPRESCINDIBLE consultar la documentación para no perder consistencia, SOLICITA CONFIRMACIÓN EXPLÍCITA al usuario antes de leer el archivo indicando cuál necesitas.
   - Lee únicamente las secciones, líneas o archivos estrictamente necesarios y directamente afectados por la tarea.
6. **Bloqueo de Commit por Fallo de Calidad**:
   - NUNCA realizar o proponer un `git commit` o `git merge` si `pnpm test`, `pnpm run lint` o `pnpm run test:coverage` fallan.
   - Si algún test o regla de ESLint falla, el agente DEBE detenerse, informar explícitamente al usuario de los errores y solucionar las fallas antes de proceder. No se permite forzar commits con errores pendientes.
7. **Respuestas Concisas (Ahorro de Tokens)**:
   - Eliminar saludos, intros ("Aquí tienes..."), rodeos y explicaciones teóricas no solicitadas.
   - Restringir al mínimo los procesos de pensamiento interno o explicaciones previas a la entrega de código.
   - Presentar directamente el código, comandos o resultados.
   - Proponer cambios específicos o funciones modificadas en lugar de reimprimir archivos enteros innecesariamente durante la fase de discusión.
   
## Skills del Proyecto

Usar las convenciones de las skills únicamente al generar o modificar el tipo de código correspondiente:

| Skill | Cuándo usar | Archivo |
|-------|-------------|---------|
| `tdd-enforcer` | Siempre que se escriba código nuevo | `skills/tdd-enforcer/SKILL.md` |
| `prisma-mock` | Al crear tests que usan base de datos | `skills/prisma-mock/SKILL.md` |
| `express-handler` | Al crear rutas, controladores o middleware | `skills/express-handler/SKILL.md` |
| `hu-scaffold` | Al empezar una nueva HU (HU01-HU22) | `skills/hu-scaffold/SKILL.md` |
| `endpoint-tester` | Al testear endpoints (exploración + formalización) | `skills/endpoint-tester/SKILL.md` |

## Reglas TDD (Estrictas)

Resumen: RED → GREEN → REFACTOR. 100% cobertura obligatoria.
Ver `skills/tdd-enforcer/SKILL.md` para el workflow detallado si es necesario.

## Comandos Útiles

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
│   ├── routes/              # Rutas Express (+ tests colocados si son unitarios)
│   ├── controllers/         # Lógica de negocio
│   ├── middleware/          # Auth (JWT), validación, rate-limit
│   └── services/           # Email (Nodemailer), upload (Cloudinary), logger (Winston)
├── prisma/
│   ├── schema.prisma        # Esquema de base de datos
│   └── seed.js              # Datos de prueba
├── tests/
│   ├── integration/         # Tests de integración (supertest)
│   └── fixtures/            # Datos de prueba reutilizables
├── skills/                  # Skills del proyecto
├── docs/
│   ├── openapi.yaml         # Especificación OpenAPI 3.0.3 (fuente de verdad)
│   ├── 0001-API-DESIGN.md   # Documento de diseño de API
│   └── 0002-IMPLEMENTATION-ORDER.md # Orden de implementación de HUs
├── README.md
├── CHANGELOG.md
└── AGENTS.md

```

## Convenciones de Escritura

* **Funciones**: Arrow functions (`const fn = async () => {}`), nunca `function` declarations.
* **Variables**: `const` por defecto, `let` solo si se reasigna, nunca `var`.
* **Async/Await**: Siempre `async/await`, nunca `.then()` chains.
* **Templates**: Siempre template literals, nunca concatenación `+`.
* **Imports**: Siempre ES Modules (`import/export`), nunca CommonJS.
* **Naming**: `camelCase` variables/funciones, `PascalCase` clases/modelos, `SCREAMING_SNAKE_CASE` constantes.
* **JSDoc**: Todo archivo con `@fileoverview`, `@module`, `@param`, `@returns`, `@security`.

## Convenciones de Testing

* Nombre descriptivo: `describe('HU01 - Galería de Colecciones', () => {...})`
* Mockear Prisma con `vi.mock('@prisma/client')` o `prisma-mock.js`.
* Mockear servicios externos (Cloudinary, Nodemailer).
* Usar `supertest` para tests de integración en `tests/integration/`.
* Cada test debe ser independiente; usar `beforeEach` para limpiar mocks/estado.

## Convenciones de Git y Workflow de HU

**Branches:** `hu/XX-nombre`, `fix/XX-nombre`, `chore/descripcion`, `refactor/descripcion`

**Commits:** Conventional Commits (ej. `feat(hu-01): add gallery endpoint`)

**Pasos obligatorios por HU:**

1. **Verificar rama**: Estar en `hu/XX-nombre` antes de escribir tests o código.
2. **TDD**: Escribir test (RED) → Implementar código (GREEN) → Refactorizar.
3. **Verificación de calidad (OBLIGATORIA)**: Ejecutar `pnpm test && pnpm run lint && pnpm run test:coverage`. Si algo falla, CORREGIR inmediatamente. NO avanzar si hay tests o reglas de ESLint fallando.
4. **Documentación de cambios**: Actualizar `CHANGELOG.md` en la sección `[Unreleased]`.
5. **PAUSA OBLIGATORIA**: Presentar resultados al usuario y solicitar confirmación explícita de finalización de la HU y ejecución del flujo de Git.
6. **Git, Actualización de Sesión, Merge y Limpieza (Solo tras confirmación de HU finalizada)**:
    * Re-verificar que tests y lint pasan. Si algo falla, ABORTAR, advertir al usuario y solucionar.
    * **Actualizar `SESION.md`**: Registrar el resumen de la HU completada y el estado para la siguiente sesión.
    * Commit y push en la rama de trabajo incluyendo la actualización de `SESION.md`:
      ```bash
      git add . && git commit -m "feat(hu-XX): descripcion" && git push origin hu/XX-nombre
      ```
    * Merge a `develop` y eliminación automática de la rama local y remota:
      ```bash
      git checkout develop && git pull origin develop && git merge --no-ff hu/XX-nombre && git push origin develop && git branch -d hu/XX-nombre && git push origin --delete hu/XX-nombre
      ```

## Seguridad (OWASP)

* No hardcodear secrets (usar variables de entorno vía `process.env` o `--env-file`).
* Sin `console.log` de datos sensibles (usar Winston logger).
* Rutas admin protegidas con middleware `authenticate` y `requireAdmin`.
* Input validado con Joi schemas en POST/PUT/PATCH.
* `helmet.js` activo en Express.

## Logging

Usar Winston (`src/services/logger.js`): `logger.info()`, `logger.error()`, `logger.warn()`.
**NO logear:** passwords, tokens, secrets o request bodies sensibles.

## Documentación y Fuente de Verdad

* La especificación OpenAPI 3.0.3 (`docs/openapi.yaml`) es la **fuente de verdad** de la API.
* Al agregar o cambiar comportamiento de endpoints, sincronizar `docs/openapi.yaml` y `CHANGELOG.md`.


---
name: endpoint-tester
description: Test API endpoints in two phases: 1) Explore with curl against real API to find bugs, 2) Formalize with written tests (supertest + mocks). Use when testing any endpoint. Triggers on: "testear endpoint", "probar endpoint", "tests", "endpoint tests", "testing endpoint", "test endpoint", "pruebas de endpoint".
---

# Endpoint Tester

Testing en dos fases para cada endpoint del proyecto.

## Fases

| Fase | Objetivo | Herramienta | Velocidad |
|------|----------|-------------|-----------|
| 1 - Exploración | Encontrar bugs, validar comportamiento | curl → API real | Lento |
| 2 - Formalización | Tests escritos, cobertura 100% | supertest + mocks | Rápido |

## Regla Fundamental

> **NUNCA ejecutar sin confirmación explícita del usuario.**

- Esperar "ejecuta", "siguiente", "dale" antes de cada acción
- No saltar pasos sin confirmación
- Mostrar código ANTES de ejecutar
- Mostrar resultado DESPUÉS de ejecutar

## Palabras de Confirmación

| Acción | Palabras válidas |
|--------|------------------|
| Ejecutar prueba actual | "ejecuta", "ejecútalo", "dale", "adelante", "run", "sí", "si" |
| Siguiente prueba | "siguiente", "next", "continúa", "sigue" |
| Saltar prueba | "skip", "saltar", "pasa" |
| Volver a Fase 1 | "explorar", "curl", "probar" |
| Ir a Fase 2 | "formalizar", "tests", "escribir" |
| Parar | "para", "stop", "alto" |
| Commit | "haz commit", "commit", "guarda" |

---

## FASE 1: EXPLORACIÓN (curl → API real)

### Objetivo
- Validar comportamiento esperado
- Encontrar bugs no detectados
- Confirmar que validaciones funcionan

### Formato de Presentación

```
Endpoint: POST /admin/collections
Tipo: CREATE
Auth: Requiere token ADMIN

Fase 1 - Exploración (8 pruebas):
1. ⏳ Datos válidos → 201
2. ⏳ Sin token → 401
3. ⏳ Token inválido → 403
4. ⏳ Título faltante → 400
5. ⏳ Título duplicado → 400
6. ⏳ FK inexistente → 404
7. ⏳ Error DB → 500
8. ⏳ Campos opcionales → 201

¿Ejecuto la prueba 1?
```

### Patrones de Prueba por Tipo de Endpoint

#### POST (create) - 8 pruebas mínimas

| # | Prueba | Status Esperado | Código |
|---|--------|-----------------|--------|
| 1 | Datos válidos + token admin | 201 | - |
| 2 | Sin token | 401 | UNAUTHORIZED |
| 3 | Token inválido/rol incorrecto | 403 | FORBIDDEN |
| 4 | Campo requerido faltante | 400 | VALIDATION_ERROR |
| 5 | Dato duplicado (si aplica) | 400 | DUPLICATE_ERROR |
| 6 | FK inexistente (si aplica) | 404 | NOT_FOUND |
| 7 | Error DB | 500 | INTERNAL_ERROR |
| 8 | Campos opcionales | 201 | - |

#### PUT (update) - 5 pruebas mínimas

| # | Prueba | Status Esperado | Código |
|---|--------|-----------------|--------|
| 1 | Datos válidos + token admin | 200 | - |
| 2 | Sin token | 401 | UNAUTHORIZED |
| 3 | ID inexistente | 404 | NOT_FOUND |
| 4 | Campo inválido | 400 | VALIDATION_ERROR |
| 5 | Error DB | 500 | INTERNAL_ERROR |

#### DELETE (remove) - 3 pruebas mínimas

| # | Prueba | Status Esperado | Código |
|---|--------|-----------------|--------|
| 1 | Token admin + ID existente | 200 | - |
| 2 | Sin token | 401 | UNAUTHORIZED |
| 3 | ID inexistente | 404 | NOT_FOUND |

#### GET (read) - 2 pruebas mínimas

| # | Prueba | Status Esperado | Código |
|---|--------|-----------------|--------|
| 1 | Recurso existente | 200 | - |
| 2 | ID inexistente | 404 | NOT_FOUND |

### Comandos curl

```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).data.token))")

# POST create
curl -s -X POST http://localhost:3000/api/v1/admin/resource \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"field":"value"}'

# PUT update
curl -s -X PUT http://localhost:3000/api/v1/admin/resource/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"field":"new value"}'

# DELETE
curl -s -X DELETE http://localhost:3000/api/v1/admin/resource/1 \
  -H "Authorization: Bearer $TOKEN"

# GET
curl -s http://localhost:3000/api/v1/resource/1
```

---

## FASE 2: FORMALIZACIÓN (tests escritos)

### Objetivo
- Crear tests automatizados
- Alcanzar 100% cobertura
- Proteger contra regresiones

### Template de Test Base

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

// Mock de servicios externos si aplica
vi.mock('../../src/services/upload.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, uploadToCloudinary: vi.fn() };
});

const app = (await import('../../src/app.js')).default;

describe('HUXX - Admin [Recurso]', () => {
  let adminToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  describe('POST /admin/resource', () => {
    describe('given admin token and valid data', () => {
      it('should return 201 with created resource', async () => {
        mockPrisma.resource.create.mockResolvedValue({
          id: 1,
          title: 'Test',
          createdAt: new Date(),
        });

        const res = await request(app)
          .post('/api/v1/admin/resource')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id', 1);
      });
    });

    describe('given no token', () => {
      it('should return 401', async () => {
        const res = await request(app)
          .post('/api/v1/admin/resource')
          .send({ title: 'Test' });

        expect(res.status).toBe(401);
      });
    });

    describe('given missing required field', () => {
      it('should return 400 VALIDATION_ERROR', async () => {
        const res = await request(app)
          .post('/api/v1/admin/resource')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.resource.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        const res = await request(app)
          .post('/api/v1/admin/resource')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Test' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
      });
    });
  });
});
```

### Patrones de Mock Prisma

```javascript
// NOT_FOUND - usar error.code P2025
const notFoundError = new Error('Record not found');
notFoundError.code = 'P2025';
mockPrisma.resource.delete.mockRejectedValue(notFoundError);

// DUPLICATE - usar message includes
mockPrisma.resource.create.mockRejectedValue(
  new Error('Unique constraint failed on the fields: (`title`)')
);

// GENERIC ERROR
mockPrisma.resource.create.mockRejectedValue(
  new Error('Database connection failed')
);
```

### Estructura de Archivos

```
tests/
├── integration/
│   ├── hu-06-admin-collections.test.js
│   ├── hu-07-admin-exhibitions.test.js
│   └── hu-XX-admin-[resource].test.js
├── unit/
│   └── hu-XX-[feature].test.js
└── helpers/
    └── prisma-mock.js
```

---

## Flujo de Ejecución

### Inicio del Skill

```
Usuario: testea POST /admin/exhibitions

AI: Seleccionando endpoint: POST /admin/exhibitions
    Tipo: CREATE
    Auth: Requiere token ADMIN

    ═══════════════════════════════════════
    FASE 1: EXPLORACIÓN (curl → API real)
    ═══════════════════════════════════════

    Pruebas a ejecutar (6):
    1. ⏳ Datos válidos → 201
    2. ⏳ Sin token → 401
    3. ⏳ Título faltante → 400
    4. ⏳ Fecha faltante → 400
    5. ⏳ Error DB → 500
    6. ⏳ Campos opcionales → 201

    ¿Ejecuto la prueba 1?
```

### Durante la Exploración

```
Usuario: ejecuta

AI: [Ejecuta curl]
    ✅ PASSED - 201 con exhibition creada

    Pruebas: 1/6 completadas
    Siguiente: Prueba 2 - Sin token → 401

    ¿Ejecuto la prueba 2?
```

### Transición a Fase 2

```
Usuario: siguiente (después de completar Fase 1)

AI: ═══════════════════════════════════════
    FASE 1 COMPLETADA ✅
    ═══════════════════════════════════════

    Resultados:
    - 6/6 pruebas pasaron
    - Bugs encontrados: [listar si hay]
    - Bugs corregidos: [listar si hay]

    ═══════════════════════════════════════
    FASE 2: FORMALIZACIÓN (tests escritos)
    ═══════════════════════════════════════

    Archivo a crear: tests/integration/hu-07-admin-exhibitions.test.js

    ¿Creo el archivo de tests?
```

### Creación de Tests

```
Usuario: sí

AI: [Crea archivo con template base]
    ✅ Archivo creado: tests/integration/hu-07-admin-exhibitions.test.js

    Tests incluidos (6):
    1. ✅ Datos válidos → 201
    2. ✅ Sin token → 401
    3. ✅ Título faltante → 400
    4. ✅ Fecha faltante → 400
    5. ✅ Error DB → 500
    6. ✅ Campos opcionales → 201

    ¿Ejecuto los tests?
```

### Verificación Final

```
Usuario: ejecuta

AI: [Ejecuta pnpm test]
    ✅ 6/6 tests pasaron

    ═══════════════════════════════════════
    VERIFICACIÓN
    ═══════════════════════════════════════

    ✅ Todos los tests pasan
    ✅ Cobertura: 100%
    ✅ Lint limpio

    ¿Hago commit?
```

---

## Bugs Conocidos y Soluciones

### Prisma P2025 - Record not found

**Problema:** Prisma lanza error genérico cuando un registro no existe.

**Solución:** Usar `error.code === 'P2025'` en vez de `error.message.includes('...')`.

```javascript
// ❌ Mal - el mensaje puede cambiar
if (error.message.includes('Record to delete does not exist')) {

// ✅ Bien - el código es estable
if (error.code === 'P2025') {
```

### Foreign Key Violation

**Problema:** Crear registro con FK inexistente lanza error genérico.

**Solución:** Validar existencia del registro padre ANTES de crear.

```javascript
// En controller create
const collection = await prisma.collection.findUnique({
  where: { id: parseInt(collectionId) },
});

if (!collection) {
  return res.status(404).json({
    error: 'La colección no existe',
    code: 'NOT_FOUND',
  });
}
```

---

## Checklist de Verificación

### Fase 1 (Exploración)
- [ ] Todas las pruebas ejecutadas
- [ ] Bugs encontrados documentados
- [ ] Bugs corregidos (si aplica)
- [ ] Comportamiento validado

### Fase 2 (Formalización)
- [ ] Archivo de tests creado
- [ ] Tests escritos para cada prueba de Fase 1
- [ ] Todos los tests pasan (`pnpm test`)
- [ ] Cobertura 100% (`pnpm run test:coverage`)
- [ ] Lint limpio (`pnpm run lint`)
- [ ] CHANGELOG actualizado (si hay cambios)

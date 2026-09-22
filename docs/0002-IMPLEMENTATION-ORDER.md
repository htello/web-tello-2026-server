# Orden de Implementación - Portfolio Artístico

## Estructura del Proyecto

```
src/
├── app.js                    # Express app + middleware + error handler
├── lib/
│   ├── prisma.js             # PrismaClient singleton
│   └── constants.js          # JWT_SECRET, JWT_EXPIRATION, BCRYPT_ROUNDS
├── routes/
│   ├── index.js              # Router principal → /api/v1
│   ├── auth.js               # POST /login
│   ├── admin.js              # POST /users/register, /upload
│   ├── collections.js        # (pendiente)
│   ├── paintings.js          # (pendiente)
│   ├── exhibitions.js        # (pendiente)
│   ├── design.js             # (pendiente)
│   ├── illustrations.js      # (pendiente)
│   ├── biography.js          # (pendiente)
│   ├── contact.js            # (pendiente)
│   └── health.js             # (en app.js directamente)
├── controllers/
│   ├── auth.js               # login, register
│   └── upload.js             # upload
├── middleware/
│   ├── auth.js               # authenticate, requireAdmin
│   ├── validate.js           # Joi validation
│   └── rateLimiter.js        # (pendiente)
└── services/
    ├── upload.js             # Multer + Cloudinary
    ├── email.js              # (pendiente)
    └── logger.js             # Winston
```

## Modelos Prisma Disponibles

```prisma
model User {
  id, email, password, name, role (ADMIN|USER), createdAt, updatedAt
}

model Collection {
  id, title, description?, coverImage?, position, isPublished, paintings[], createdAt, updatedAt
}

model Painting {
  id, title, imageUrl, dimensions?, technique?, year?, isFeatured, isPublished, position, collectionId, collection, createdAt, updatedAt
}

model Exhibition {
  id, title, date, location?, description?, position, createdAt, updatedAt
}

model DesignProject {
  id, title, description?, imageUrl, category, subcategory, createdAt, updatedAt
}

model Illustration {
  id, title, description?, imageUrl, createdAt, updatedAt
}

model Biography {
  id, content, imageUrl?, updatedAt  // Singleton
}
```

---

## Reglas de Flujo (Aplican a TODAS las HUs)

| Paso | Acción | Verificación |
|------|--------|--------------|
| 1 | Crear test(s) | `pnpm test` → RED |
| 2 | Implementar código | `pnpm test` → GREEN |
| 3 | Refactorizar | Tests siguen pasando |
| 4 | Coverage 100% | `pnpm run test:coverage` |
| 5 | Lint limpio | `pnpm run lint` |
| **Docs** | Verificar `openapi.yaml` sincronizado antes de commit |
| **Commit** | Esperar confirmación explícita del usuario |

**Reglas adicionales:**
- No saltar fases: Cada fase depende de la anterior
- Completar fase antes de continuar: No empezar Fase 3 sin completar Fase 2
- Cada HU debe tener 100% cobertura: No avanzar sin tests pasando
- Fase 7 es independiente: No requiere backend, puede hacerse en paralelo

---

## Patrones de Implementación

### Prisma Singleton

Todos los controllers importan `prisma` desde `src/lib/prisma.js`:

```js
import prisma from '../lib/prisma.js';
```

NUNCA hacer `new PrismaClient()` en controllers.

### Patrón de Error Handling

Todos los controllers usan try/catch directo:

```js
const handler = async (req, res) => {
  try {
    // lógica
    res.status(200).json({ data: resultado });
  } catch (error) {
    logger.error('Error en X', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};
```

**Errores específicos (sin try/catch):**
- Recurso no encontrado → `res.status(404).json({ error: '...', code: 'NOT_FOUND' })`
- Validación fallida → middleware `validate()` ya retorna 400
- Email duplicado → `res.status(400).json({ error: '...', code: 'VALIDATION_ERROR' })`
- No autenticado → middleware `authenticate()` retorna 401
- No autorizado → middleware `requireAdmin()` retorna 403

### Patrón Reorder

Todos los endpoints de reorder usan el mismo patrón:

**Request:** `POST /admin/{resource}/reorder`

```json
{ "orderedIds": [3, 1, 2] }
```

**Controller:**

```js
const reorder = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.resource.update({
          where: { id },
          data: { position: index },
        })
      )
    );
    res.json({ data: { message: 'Orden actualizado' } });
  } catch (error) {
    logger.error('Error en reorder', { error: error.message });
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};
```

**Validación Joi:** `reorderSchema` (definido en `src/middleware/validate.js`)

### Patrón de Tests

**Unit tests** (al lado del archivo):
```js
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';
```

**Integration tests** (en `tests/integration/`):
```js
import { mockPrisma } from '../helpers/prisma-mock.js';
import request from 'supertest';
const app = (await import('../../src/app.js')).default;
```

### Joi Schemas

Todos los schemas están en `src/middleware/validate.js`:

| Schema | Para HU |
|--------|---------|
| `loginSchema` | HU20 |
| `registerSchema` | HU22 |
| `collectionSchema` | HU06 |
| `paintingSchema` | HU06 |
| `exhibitionSchema` | HU07 |
| `designSchema` | HU10 |
| `illustrationSchema` | HU10 |
| `biographySchema` | HU12 |
| `contactSchema` | HU13 |
| `reorderSchema` | HU06, HU07, HU10 |

---

## Diagrama de Dependencias

```
┌─────────────────────┐
│  Fase 0: Setup      │
│  Proyecto base      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fase 1: Auth       │
│ HU20 → HU22 → HU21 │
│       → HU19       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fase 2: Upload     │
│  HU16               │
└──────────┬──────────┘
           │
     ┌─────┼─────┐
     │     │     │
     ▼     ▼     ▼
┌────────┐ ┌────────┐ ┌────────┐
│Fase 3: │ │Fase 4: │ │Fase 5: │
│Admin   │ │Galería │ │Design  │
│HU06→.. │ │HU01→.. │ │HU08→HU09│
│→HU12   │ │→HU05   │ │        │
└────────┘ └────────┘ └────────┘
           │
           ▼
┌─────────────────────┐
│  Fase 6: Resto      │
│  HU11 → HU13 → ...  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fase 7: Frontend   │
│  HU17 → HU18        │
└─────────────────────┘
```

---

## Fase 0: Setup del Proyecto

Trabajo previo a cualquier HU. No es una HU, es infraestructura base.

1. Inicializar proyecto Node.js (`package.json`, `"type": "module"`)
2. Instalar dependencias core: express, prisma, helmet, cors, etc.
3. Instalar dependencias de testing: vitest, supertest
4. Instalar dependencias de seguridad: bcrypt, jsonwebtoken
5. Docker + PostgreSQL (`docker-compose.yml`)
6. Prisma schema + migración inicial
7. Estructura Express (`src/routes`, `src/controllers`, `src/middleware`, `src/services`)
8. Configurar Vitest (`vitest.config.js`)
9. Configurar ESLint
10. Crear `.env` + `.env.example`
11. Seed data (`prisma/seed.js`)
12. Configurar GitHub Actions CI/CD
13. Commit inicial

---

## Fase 1: Auth + Infraestructura

Requerida para todo lo demás.

```
HU20 → HU22 → HU21 → HU19
```

---

### HU20 - Login Admin

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/v1/auth/login` |
| **Modelo Prisma** | `User` |
| **Archivos a crear** | `src/controllers/auth.js`, `src/routes/auth.js` |
| **Test file** | `tests/integration/hu-20-auth-login.test.js` |
| **Depende de** | — |

**Test cases:**
1. `POST /api/v1/auth/login` con `{ email: "admin@test.com", password: "Admin123!" }`
   → 200, `body.data.token` es string, `body.data.user` tiene `{ id, email, name, role }`
2. `POST /api/v1/auth/login` con email inexistente
   → 401, `body.error.code === "UNAUTHORIZED"`
3. `POST /api/v1/auth/login` con password incorrecto
   → 401, `body.error.code === "UNAUTHORIZED"`
4. `POST /api/v1/auth/login` con body vacío `{}`
   → 400, `body.error.code === "VALIDATION_ERROR"`
5. `POST /api/v1/auth/login` con email formato inválido
   → 400, `body.error.code === "VALIDATION_ERROR"`

**Controller `login`:**
- Inputs: `req.body { email, password }`
- Validación Joi: `email` (string, email), `password` (string, min 8)
- Lógica:
  - `User.findUnique({ where: { email } })`
  - Si no existe → 401 UNAUTHORIZED
  - `bcrypt.compare(password, user.password)`
  - Si no coincide → 401 UNAUTHORIZED
  - `jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION })`
- Response: `{ data: { token, user: { id, email, name, role } } }`
- Error catch → 500 INTERNAL_ERROR

**Routes `POST /login`:**
- `validate(loginSchema)` → `login`

---

### HU22 - Registro Admin

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/v1/admin/users/register` |
| **Modelo Prisma** | `User` |
| **Archivos a modificar** | `src/controllers/auth.js` (agregar `register`), `src/routes/admin.js` |
| **Test file** | `tests/integration/hu-22-admin-register.test.js` |
| **Depende de** | HU20 |

**Test cases:**
1. Admin autenticado + `{ email: "nuevo@test.com", password: "pass1234" }`
   → 201, `body.data` tiene `{ id, email, name, role: "ADMIN" }`
2. Sin token
   → 401, `body.error.code === "UNAUTHORIZED"`
3. Token de usuario no admin
   → 403, `body.error.code === "FORBIDDEN"`
4. Email ya registrado
   → 400, `body.error.code === "VALIDATION_ERROR"`
5. Body vacío `{}`
   → 400, `body.error.code === "VALIDATION_ERROR"`
6. Password < 8 caracteres
   → 400, `body.error.code === "VALIDATION_ERROR"`

**Controller `register`:**
- Inputs: `req.body { email, password, name? }`
- Validación Joi: `email` (string, email), `password` (string, min 8), `name` (string, optional)
- Lógica:
  - `User.findUnique({ where: { email } })`
  - Si existe → 400 VALIDATION_ERROR
  - `bcrypt.hash(password, BCRYPT_ROUNDS)`
  - `User.create({ data: { email, password: hashed, name, role: 'ADMIN' } })`
- Response: `{ data: { id, email, name, role } }` (201)
- Error catch → 500 INTERNAL_ERROR

**Routes `POST /users/register`:**
- `authenticate` → `requireAdmin` → `validate(registerSchema)` → `register`

---

### HU21 - Protección de Rutas

| Campo | Valor |
|-------|-------|
| **Endpoint** | Middleware (sin endpoint propio) |
| **Archivos a crear** | `src/middleware/auth.js` (authenticate, requireAdmin) |
| **Test file** | `tests/integration/hu-21-route-protection.test.js` |
| **Depende de** | HU20 |

**Test cases:**
1. Request a ruta protegida sin header Authorization
   → 401, `body.error.code === "UNAUTHORIZED"`
2. Request con header `Bearer token_invalido`
   → 403, `body.error.code === "FORBIDDEN"`
3. Request con header `Bearer <token_válido>`
   → next() se ejecuta (pasa al controller)
4. Request a ruta admin con token de usuario no admin (role: USER)
   → 403, `body.error.code === "FORBIDDEN"`

**Middleware `authenticate`:**
- Extraer `Authorization` header
- Si no existe o no empieza con "Bearer " → 401 UNAUTHORIZED
- `token = authHeader.split(' ')[1]`
- `jwt.verify(token, JWT_SECRET)` → decodificar
- `req.user = decoded` → `next()`
- Si verify falla → 403 FORBIDDEN

**Middleware `requireAdmin`:**
- Verificar `req.user.role === 'ADMIN'`
- Si no es admin → 403 FORBIDDEN
- Si es admin → `next()`

---

### HU19 - Health Check

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/health` |
| **Archivos** | `src/app.js` (ya implementado en línea 57-59) |
| **Test file** | `tests/integration/hu-19-health-check.test.js` |
| **Depende de** | — |

**Test cases:**
1. `GET /api/v1/health`
   → 200, `body.status === "ok"`, `body.timestamp` es string ISO

**Ya implementado:** Verificar que funciona correctamente.

---

## Fase 2: Upload de Archivos

Requerida para admin CRUD de contenido con imágenes.

```
HU16
```

---

### HU16 - Upload de Archivos

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/v1/admin/upload` |
| **Modelo Prisma** | Ninguno (usa Cloudinary) |
| **Archivos** | `src/services/upload.js`, `src/controllers/upload.js`, `src/routes/upload.js` |
| **Test file** | `tests/integration/hu-16-file-upload.test.js` |
| **Depende de** | HU21 |

**Test cases:**
1. Archivo válido (JPEG, < 5MB) + token admin
   → 200, `body.data` tiene `{ url, thumbnail, width, height, format }`
2. Sin token
   → 401, `body.error.code === "UNAUTHORIZED"`
3. Tipo MIME inválido (ej: .exe)
   → 400, `body.error.code === "VALIDATION_ERROR"`
4. Archivo > 5MB
   → 400, `body.error.code === "VALIDATION_ERROR"`
5. Sin archivo en el request
   → 400, `body.error.code === "VALIDATION_ERROR"`

**Service `upload.js`:**
- Multer: `memoryStorage`, max 5MB, fileFilter (JPEG, PNG, WebP)
- `uploadToCloudinary(file, folder)`:
  - Subir buffer a Cloudinary con `upload_stream`
  - Transformar: resize 1200x1200, quality auto
  - Generar thumbnail: resize 300x300
  - Retornar: `{ url, thumbnail, width, height, format }`

**Controller `upload.js`:**
- `upload`:
  - Verificar `req.file` existe
  - Llamar `uploadService.uploadToCloudinary(req.file, 'portfolio')`
  - Retornar `{ data: { url, thumbnail, width, height, format } }`

**Routes `POST /upload`:**
- `authenticate` → `upload.single('file')` → `controller.upload`

---

## Fase 3: Admin CRUD de Contenido

Depende de HU16 para subir imágenes.

```
HU06 → HU07 → HU10 → HU12
```

---

### HU06 - Admin Colecciones y Pinturas

| Campo | Valor |
|-------|-------|
| **Endpoints** | 10 endpoints admin (ver openapi.yaml) |
| **Modelo Prisma** | `Collection`, `Painting` |
| **Archivos** | `src/controllers/collections.js`, `src/controllers/paintings.js`, `src/routes/collections.js`, `src/routes/paintings.js` |
| **Test file** | `tests/integration/hu-06-admin-collections.test.js` |
| **Depende de** | HU16 |

**Endpoints y test cases:**

**Collections Admin:**
1. `POST /admin/collections` + token admin + `{ title: "Mi Colección" }`
   → 201, `body.data` tiene `{ id, title, isPublished: false, position: 0 }`
2. `PUT /admin/collections/1` + token admin + `{ title: "Nuevo Título" }`
   → 200, `body.data.title === "Nuevo Título"`
3. `DELETE /admin/collections/1` + token admin
   → 200, `body.data.message` confirma eliminación
4. `POST /admin/collections/reorder` + token admin + `{ orderedIds: [3, 1, 2] }`
   → 200, posiciones actualizadas
5. Sin token en cualquiera → 401
6. Collection no existe → 404 NOT_FOUND

**Paintings Admin:**
7. `POST /admin/paintings` + token admin + `{ title, imageUrl, collectionId }`
   → 201, `body.data` tiene `{ id, title, imageUrl, collectionId }`
8. `PUT /admin/paintings/1` + token admin + `{ title: "Nuevo" }`
   → 200, `body.data.title === "Nuevo"`
9. `DELETE /admin/paintings/1` + token admin
   → 200
10. `PUT /admin/paintings/1/feature` + token admin
    → 200, `body.data.isFeatured === true` (toggle)
11. `PUT /admin/paintings/1/publish` + token admin
    → 200, `body.data.isPublished === false` (toggle)
12. `POST /admin/paintings/reorder` + token admin + `{ orderedIds: [2, 1], collectionId }`
    → 200

**Controller `collections.js`:**
- `create`: `Collection.create({ data: { title, description, coverImage } })`
- `update`: `Collection.update({ where: { id }, data: { ... } })`
- `delete`: `Collection.delete({ where: { id } })` (cascade paintings)
- `reorder`: forEach `orderedIds`, update position

**Controller `paintings.js`:**
- `create`: `Painting.create({ data: { title, imageUrl, dimensions, technique, year, collectionId } })`
- `update`: `Painting.update({ where: { id }, data: { ... } })`
- `delete`: `Painting.delete({ where: { id } })`
- `feature`: `Painting.update({ where: { id }, data: { isFeatured: !current } })`
- `publish`: `Painting.update({ where: { id }, data: { isPublished: !current } })`
- `reorder`: forEach `orderedIds`, update position (filtered by collectionId)

---

### HU07 - Admin Exposiciones

| Campo | Valor |
|-------|-------|
| **Endpoints** | 4 endpoints admin |
| **Modelo Prisma** | `Exhibition` |
| **Archivos** | `src/controllers/exhibitions.js`, `src/routes/exhibitions.js` |
| **Test file** | `tests/integration/hu-07-admin-exhibitions.test.js` |
| **Depende de** | HU16 |

**Endpoints y test cases:**
1. `POST /admin/exhibitions` + token admin + `{ title, date }`
   → 201, `body.data` tiene `{ id, title, date, position }`
2. `PUT /admin/exhibitions/1` + token admin + `{ title: "Nuevo" }`
   → 200
3. `DELETE /admin/exhibitions/1` + token admin
   → 200
4. `POST /admin/exhibitions/reorder` + token admin + `{ orderedIds: [2, 1] }`
   → 200
5. Sin token → 401
6. `title` faltante → 400 VALIDATION_ERROR
7. `date` faltante → 400 VALIDATION_ERROR

**Controller `exhibitions.js`:**
- `create`: `Exhibition.create({ data: { title, date, location, description } })`
- `update`: `Exhibition.update({ where: { id }, data: { ... } })`
- `delete`: `Exhibition.delete({ where: { id } })`
- `reorder`: forEach `orderedIds`, update position

---

### HU10 - Admin Diseño e Ilustración

| Campo | Valor |
|-------|-------|
| **Endpoints** | 6 endpoints admin |
| **Modelo Prisma** | `DesignProject`, `Illustration` |
| **Archivos** | `src/controllers/design.js`, `src/controllers/illustrations.js`, `src/routes/design.js`, `src/routes/illustrations.js` |
| **Test file** | `tests/integration/hu-10-admin-design.test.js` |
| **Depende de** | HU16 |

**Endpoints y test cases:**

**Design Admin:**
1. `POST /admin/design` + token admin + `{ title, category, subcategory, imageUrl }`
   → 201
2. `PUT /admin/design/1` + token admin + `{ title: "Nuevo" }`
   → 200
3. `DELETE /admin/design/1` + token admin
   → 200

**Illustrations Admin:**
4. `POST /admin/illustrations` + token admin + `{ title, imageUrl }`
   → 201
5. `PUT /admin/illustrations/1` + token admin + `{ title: "Nuevo" }`
   → 200
6. `DELETE /admin/illustrations/1` + token admin
   → 200

7. Sin token → 401
8. `title` faltante → 400 VALIDATION_ERROR
9. `category` faltante (design) → 400 VALIDATION_ERROR
10. `subcategory` faltante (design) → 400 VALIDATION_ERROR

**Controller `design.js`:**
- `create`: `DesignProject.create({ data: { title, description, imageUrl, category, subcategory } })`
- `update`: `DesignProject.update({ where: { id }, data: { ... } })`
- `delete`: `DesignProject.delete({ where: { id } })`

**Controller `illustrations.js`:**
- `create`: `Illustration.create({ data: { title, description, imageUrl } })`
- `update`: `Illustration.update({ where: { id }, data: { ... } })`
- `delete`: `Illustration.delete({ where: { id } })`

---

### HU12 - Admin Biografía

| Campo | Valor |
|-------|-------|
| **Endpoints** | 2 endpoints admin |
| **Modelo Prisma** | `Biography` |
| **Archivos** | `src/controllers/biography.js`, `src/routes/biography.js` |
| **Test file** | `tests/integration/hu-12-admin-biography.test.js` |
| **Depende de** | HU16 |

**Endpoints y test cases:**
1. `POST /admin/biography` + token admin + `{ content: "Mi biografía..." }`
   → 201, `body.data` tiene `{ id, content }`
2. `PUT /admin/biography` + token admin + `{ content: "Actualización..." }`
   → 200, `body.data.content === "Actualización..."`
3. Sin token → 401
4. `content` vacío → 400 VALIDATION_ERROR
5. Si ya existe biografía, POST retorna 409 CONFLICT

**Controller `biography.js`:**
- `create`:
  - Verificar si ya existe: `Biography.findFirst()`
  - Si existe → 409 CONFLICT
  - `Biography.create({ data: { content, imageUrl } })`
- `update`:
  - `Biography.findFirst()` → si no existe → 404 NOT_FOUND
  - `Biography.update({ where: { id }, data: { content, imageUrl } })`
- **Nota:** Biography es singleton (solo 1 registro)

---

## Fase 4: Galería Pública

Contenido principal del portfolio. Independiente de admin.

```
HU01 → HU02 → HU03 → HU04 → HU05
```

---

### HU01 - Galería de Colecciones

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/collections` |
| **Modelo Prisma** | `Collection` |
| **Archivos a crear** | `src/controllers/collections.js`, `src/routes/collections.js` |
| **Test file** | `tests/unit/hu-01-gallery.test.js` |
| **Depende de** | — |

**Test cases:**
1. Colecciones publicadas existen
   → 200, `body.data` es array, cada item tiene `{ id, title, coverImage, paintingsCount }`
2. Sin colecciones publicadas
   → 200, `body.data === []`

**Controller `listPublished`:**
- `Collection.findMany({ where: { isPublished: true }, orderBy: { position: 'asc' }, include: { _count: { select: { paintings: true } } } })`
- Response: `{ data: collections.map(c => ({ ...c, paintingsCount: c._count.paintings })) }`

**Routes `GET /`:**
- Sin auth → `listPublished`

---

### HU02 - Detalle de Colección

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/collections/:id` |
| **Modelo Prisma** | `Collection` + `Painting` |
| **Archivos a modificar** | `src/controllers/collections.js` (agregar `getById`) |
| **Test file** | `tests/unit/hu-02-collection-detail.test.js` |
| **Depende de** | HU01 |

**Test cases:**
1. `GET /api/v1/collections/1` con ID existente
   → 200, `body.data` tiene `{ id, title, paintings: [...] }`
2. `GET /api/v1/collections/999` con ID inexistente
   → 404, `body.error.code === "NOT_FOUND"`

**Controller `getById`:**
- `Collection.findUnique({ where: { id: parseInt(id) }, include: { paintings: { orderBy: { position: 'asc' } } } })`
- Si no existe → 404 NOT_FOUND
- Response: `{ data: collection }`

**Routes `GET /:id`:**
- Sin auth → `getById`

---

### HU03 - Ficha de Pintura

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/paintings/:id` |
| **Modelo Prisma** | `Painting` + `Collection` |
| **Archivos a crear** | `src/controllers/paintings.js`, `src/routes/paintings.js` |
| **Test file** | `tests/unit/hu-03-painting-card.test.js` |
| **Depende de** | — |

**Test cases:**
1. `GET /api/v1/paintings/1` con ID existente
   → 200, `body.data` tiene `{ id, title, imageUrl, collection: { id, title } }`
2. `GET /api/v1/paintings/999` con ID inexistente
   → 404, `body.error.code === "NOT_FOUND"`

**Controller `getById`:**
- `Painting.findUnique({ where: { id: parseInt(id) }, include: { collection: { select: { id: true, title: true } } } })`
- Si no existe → 404 NOT_FOUND
- Response: `{ data: painting }`

**Routes `GET /:id`:**
- Sin auth → `getById`

---

### HU04 - Obras Destacadas

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/paintings/featured` |
| **Modelo Prisma** | `Painting` + `Collection` |
| **Archivos a modificar** | `src/controllers/paintings.js` (agregar `getFeatured`) |
| **Test file** | `tests/unit/hu-04-featured-lightbox.test.js` |
| **Depende de** | — |

**Test cases:**
1. Hay pinturas destacadas y publicadas
   → 200, `body.data` es array de paintings con `collection`
2. No hay pinturas destacadas
   → 200, `body.data === []`

**Controller `getFeatured`:**
- `Painting.findMany({ where: { isFeatured: true, isPublished: true }, include: { collection: { select: { id: true, title: true } } } })`
- Response: `{ data: paintings }`

**Routes `GET /featured`:**
- Sin auth → `getFeatured`

---

### HU05 - Exposiciones

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/exhibitions` |
| **Modelo Prisma** | `Exhibition` |
| **Archivos a crear** | `src/controllers/exhibitions.js`, `src/routes/exhibitions.js` |
| **Test file** | `tests/unit/hu-05-exhibitions.test.js` |
| **Depende de** | — |

**Test cases:**
1. Exposiciones existen
   → 200, `body.data` es array ordenado por `position`
2. Sin exposiciones
   → 200, `body.data === []`

**Controller `listAll`:**
- `Exhibition.findMany({ orderBy: { position: 'asc' } })`
- Response: `{ data: exhibitions }`

**Routes `GET /`:**
- Sin auth → `listAll`

---

## Fase 5: Diseño e Ilustración

Sección de diseño gráfico e ilustraciones.

```
HU08 → HU09
```

---

### HU08 - Filtrar Diseño

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/design` |
| **Modelo Prisma** | `DesignProject` |
| **Archivos a crear** | `src/controllers/design.js`, `src/routes/design.js` |
| **Test file** | `tests/unit/hu-08-design-filter.test.js` |
| **Depende de** | — |

**Test cases:**
1. `GET /api/v1/design` sin query params
   → 200, `body.data` es array de todos los proyectos
2. `GET /api/v1/design?subcategory=web`
   → 200, `body.data` solo contiene proyectos con `subcategory === "web"`
3. `GET /api/v1/design?subcategory=inexistente`
   → 200, `body.data === []`

**Controller `listFiltered`:**
- Si `req.query.subcategory` existe:
  - `DesignProject.findMany({ where: { subcategory } })`
- Si no:
  - `DesignProject.findMany()`
- Response: `{ data: projects }`

**Routes `GET /`:**
- Sin auth → `listFiltered`

---

### HU09 - Galería Ilustración

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/illustrations` |
| **Modelo Prisma** | `Illustration` |
| **Archivos a crear** | `src/controllers/illustrations.js`, `src/routes/illustrations.js` |
| **Test file** | `tests/unit/hu-09-illustration-gallery.test.js` |
| **Depende de** | — |

**Test cases:**
1. Ilustraciones existen
   → 200, `body.data` es array
2. Sin ilustraciones
   → 200, `body.data === []`

**Controller `listAll`:**
- `Illustration.findMany()`
- Response: `{ data: illustrations }`

**Routes `GET /`:**
- Sin auth → `listAll`

---

## Fase 6: Resto Backend

Funcionalidades adicionales del backend.

```
HU11 → HU13 → HU14 → HU15
```

---

### HU11 - Leer Biografía

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/v1/biography` |
| **Modelo Prisma** | `Biography` |
| **Archivos a modificar** | `src/controllers/biography.js` (agregar `get`), `src/routes/biography.js` |
| **Test file** | `tests/unit/hu-11-biography.test.js` |
| **Depende de** | — |

**Test cases:**
1. Biografía existe
   → 200, `body.data` tiene `{ id, content, imageUrl }`
2. Sin biografía
   → 404, `body.error.code === "NOT_FOUND"`

**Controller `get`:**
- `Biography.findFirst()`
- Si no existe → 404 NOT_FOUND
- Response: `{ data: biography }`

**Routes `GET /`:**
- Sin auth → `get`

---

### HU13 - Formulario de Contacto

| Campo | Valor |
|-------|-------|
| **Endpoint** | `POST /api/v1/contact` |
| **Modelo Prisma** | Ninguno |
| **Archivos a crear** | `src/controllers/contact.js`, `src/routes/contact.js` |
| **Test file** | `tests/integration/hu-13-contact-form.test.js` |
| **Depende de** | HU14, HU15 |

**Test cases:**
1. `{ name, email, subject, message }` válidos
   → 201, `body.data.message === "Mensaje enviado correctamente"`
2. `name` faltante
   → 400, `body.error.code === "VALIDATION_ERROR"`
3. `email` faltante
   → 400, `body.error.code === "VALIDATION_ERROR"`
4. `message` faltante
   → 400, `body.error.code === "VALIDATION_ERROR"`
5. 6ª request en 1 minuto (rate limit)
   → 429, `body.error.code === "RATE_LIMITED"`

**Controller `send`:**
- Validación Joi: `name` (string, required), `email` (string, email, required), `subject` (string, required), `message` (string, required, min 10)
- Llamar `emailService.sendContactEmail({ name, email, subject, message })`
- Response: `{ data: { message: "Mensaje enviado correctamente" } }` (201)

**Routes `POST /`:**
- `rateLimiter` → `validate(contactSchema)` → `send`

---

### HU14 - Envío por Email

| Campo | Valor |
|-------|-------|
| **Endpoint** | Service interno (sin endpoint) |
| **Archivos a crear** | `src/services/email.js` |
| **Test file** | `tests/unit/hu-14-email-service.test.js` |
| **Depende de** | — |

**Test cases:**
1. Email enviado exitosamente (mock Nodemailer)
   → `{ success: true }`
2. Error de envío (mock Nodemailer lanza error)
   → `{ success: false, error: "..." }`

**Service `email.js`:**
- Configurar Nodemailer transporter (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- `sendContactEmail({ name, email, subject, message })`:
  - Construir HTML con datos del contacto
  - Enviar a `SMTP_USER` (邮箱 del admin)
  - Retornar `{ success: true }` o `{ success: false, error }`

---

### HU15 - Anti-Spam (Rate Limiting)

| Campo | Valor |
|-------|-------|
| **Endpoint** | Middleware (sin endpoint propio) |
| **Archivos a crear** | `src/middleware/rateLimiter.js` |
| **Test file** | `tests/unit/hu-15-rate-limit.test.js` |
| **Depende de** | — |

**Test cases:**
1. Primera request → pasa (200 o 201)
2. 6ª request en 1 minuto → 429 RATE_LIMITED
3. Request después de 1 minuto → pasa de nuevo

**Middleware `rateLimiter.js`:**
- `express-rate-limit`: `windowMs: 60000`, `max: 5`
- `message: { error: "Demasiadas peticiones. Intenta de nuevo en 1 minuto.", code: "RATE_LIMITED" }`

---

## Fase 7: Frontend-only

Sin endpoint backend. Se resuelven en el frontend.

> **Nota (estado):** Fuera de alcance del backend. HU17 (anti-descarga) y HU18 (SEO
> meta tags) son exclusivamente frontend (CSS/JS, Open Graph, meta description,
> JSON-LD). No requieren ni deben implementarse en este repositorio; se abordan
> cuando exista un repositorio frontend. El backend queda completo en la Fase 6.

```
HU17 → HU18
```

---

### HU17 - Anti-Descarga

| Campo | Valor |
|-------|-------|
| **Endpoint** | Sin endpoint backend |
| **Test file** | `tests/unit/hu-17-download-protection.test.js` |
| **Depende de** | — |

**Test cases:**
1. Headers de respuesta de imágenes no exponen URLs de almacenamiento directo
2. Respuesta incluye `Content-Disposition: inline`

**Frontend (no server):**
- CSS: `user-select: none` en imágenes
- Bloquear `contextmenu` derecho
- `draggable="false"` en img tags
- Imágenes servidas vía Cloudinary con transformaciones

---

### HU18 - SEO Meta Tags

| Campo | Valor |
|-------|-------|
| **Endpoint** | Sin endpoint backend |
| **Test file** | `tests/unit/hu-18-seo-meta.test.js` |
| **Depende de** | — |

**Test cases:**
1. Endpoints de gallery retornan `title` y `description` en response
2. Endpoints de paintings retornan `title`, `description`, `imageUrl`

**Frontend (no server):**
- Open Graph tags dinámicos por página
- `meta description` por sección
- Structured data (JSON-LD) para artista

---

## Archivos de Prisma (Referencia Rápida)

| HU | Modelo Prisma | Método Prisma |
|----|---------------|---------------|
| HU20 | User | `findUnique({ where: { email } })` |
| HU22 | User | `findUnique`, `create` |
| HU16 | — | Cloudinary (no DB) |
| HU06 | Collection, Painting | `findUnique`, `create`, `update`, `delete` |
| HU07 | Exhibition | `findUnique`, `create`, `update`, `delete` |
| HU10 | DesignProject, Illustration | `findUnique`, `create`, `update`, `delete` |
| HU12 | Biography | `findFirst`, `create`, `update` |
| HU01 | Collection | `findMany({ where: { isPublished: true } })` |
| HU02 | Collection | `findUnique({ include: { paintings } })` |
| HU03 | Painting | `findUnique({ include: { collection } })` |
| HU04 | Painting | `findMany({ where: { isFeatured: true } })` |
| HU05 | Exhibition | `findMany({ orderBy: { position } })` |
| HU08 | DesignProject | `findMany({ where: { subcategory } })` |
| HU09 | Illustration | `findMany()` |
| HU11 | Biography | `findFirst()` |
| HU13 | — | Nodemailer (no DB) |
| HU14 | — | Nodemailer (no DB) |
| HU15 | — | express-rate-limit (no DB) |

# Diseño de API - Portfolio Artístico

## Convenciones Generales

- **Base URL:** `/api/v1`
- **Formato respuesta:** `{ "data": {...} }` / `{ "error": "msg", "code": "CODE" }`
- **Paginación:** `?page=1&limit=20` → `{ "data": [...], "meta": { "total", "page", "limit", "pages" } }`
- **Autenticación:** `Authorization: Bearer <JWT>`
- **ContentType:** `application/json` (excepto upload → `multipart/form-data`)

---

## 1. Autenticación (HU20, HU21)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Registrar nuevo usuario | No |
| `POST` | `/api/v1/auth/login` | Login, retorna JWT | No |

**POST /api/v1/auth/register**
```json
// Request
{ "email": "nuevo@test.com", "password": "clave123", "name": "Nuevo Usuario" }

// Response 201
{ "data": { "id": 2, "email": "nuevo@test.com", "name": "Nuevo Usuario", "role": "USER" } }

// Error 400
{ "error": "El email ya está registrado", "code": "VALIDATION_ERROR" }
```

**POST /api/v1/auth/login**
```json
// Request
{ "email": "admin@test.com", "password": "admin123" }

// Response 200
{ "data": { "token": "eyJ...", "user": { "id": 1, "email": "admin@test.com", "role": "ADMIN" } } }

// Error 401
{ "error": "Credenciales inválidas", "code": "UNAUTHORIZED" }
```

**Middleware de protección (HU21):** Todas las rutas `POST`, `PUT`, `DELETE` bajo `/api/v1/admin/*` requieren JWT válido. Respuesta `401` sin token, `403` con token inválido/rol incorrecto.

---

## 2. Gestión de Usuarios (Admin)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/admin/users` | Listar todos los usuarios | Admin |
| `GET` | `/api/v1/admin/users/:id` | Obtener detalle de usuario | Admin |
| `PUT` | `/api/v1/admin/users/:id` | Editar usuario (rol, nombre, email) | Admin |
| `DELETE` | `/api/v1/admin/users/:id` | Eliminar usuario | Admin |
| `PUT` | `/api/v1/admin/users/:id/password` | Resetear contraseña de usuario | Admin |

**GET /api/v1/admin/users**
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "email": "admin@test.com",
      "name": "Administrador",
      "role": "ADMIN",
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20, "pages": 1 }
}
```

**PUT /api/v1/admin/users/:id**
```json
// Request
{ "email": "actualizado@test.com", "name": "Nombre Actualizado", "role": "ADMIN" }

// Response 200
{ "data": { "id": 2, "email": "actualizado@test.com", "name": "Nombre Actualizado", "role": "ADMIN" } }
```

**PUT /api/v1/admin/users/:id/password**
```json
// Request
{ "password": "nuevaClave123" }

// Response 200
{ "data": { "message": "Contraseña actualizada correctamente" } }
```

---

## 3. Colecciones (HU01, HU02, HU06)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/collections` | Listar colecciones publicadas | No |
| `GET` | `/api/v1/collections/:id` | Detalle de colección + sus pinturas | No |
| `POST` | `/api/v1/admin/collections` | Crear colección | Admin |
| `PUT` | `/api/v1/admin/collections/:id` | Editar colección | Admin |
| `DELETE` | `/api/v1/admin/collections/:id` | Eliminar colección | Admin |
| `PUT` | `/api/v1/admin/collections/reorder` | Reordenar colecciones | Admin |

**GET /api/v1/collections**
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Óleos",
      "description": "Colección de óleos sobre lienzo",
      "coverImage": "https://res.cloudinary.com/.../cover.jpg",
      "position": 1,
      "isPublished": true,
      "paintingsCount": 12
    }
  ]
}
```

**GET /api/v1/collections/:id**
```json
// Response 200
{
  "data": {
    "id": 1,
    "title": "Óleos",
    "description": "...",
    "coverImage": "...",
    "position": 1,
    "paintings": [
      {
        "id": 1,
        "title": "Atardecer",
        "imageUrl": "...",
        "dimensions": "80x60 cm",
        "technique": "Óleo sobre lienzo",
        "year": 2024,
        "isFeatured": true
      }
    ]
  }
}
```

**POST/PUT /api/v1/admin/collections**
```json
// Request body
{
  "title": "Óleos",
  "description": "Colección de óleos",
  "coverImage": "https://...",
  "position": 1,
  "isPublished": true
}
```

**PUT /api/v1/admin/collections/reorder**
```json
// Request
{ "orderedIds": [3, 1, 2] }
```

---

## 4. Pinturas (HU03, HU04, HU06)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/paintings/featured` | Obras destacadas (portada) | No |
| `GET` | `/api/v1/paintings/:id` | Ficha detallada de pintura | No |
| `POST` | `/api/v1/admin/paintings` | Crear pintura | Admin |
| `PUT` | `/api/v1/admin/paintings/:id` | Editar pintura | Admin |
| `DELETE` | `/api/v1/admin/paintings/:id` | Eliminar pintura | Admin |
| `PUT` | `/api/v1/admin/paintings/:id/feature` | Marcar/desmarcar destacada | Admin |
| `PUT` | `/api/v1/admin/paintings/:id/publish` | Publicar/ocultar pintura | Admin |
| `PUT` | `/api/v1/admin/paintings/reorder` | Reordenar pinturas dentro de colección | Admin |

**GET /api/v1/paintings/featured**
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Atardecer",
      "imageUrl": "...",
      "dimensions": "80x60 cm",
      "technique": "Óleo sobre lienzo",
      "year": 2024,
      "collection": { "id": 1, "title": "Óleos" }
    }
  ]
}
```

**GET /api/v1/paintings/:id**
```json
// Response 200 — omite campos no registrados
{
  "data": {
    "id": 1,
    "title": "Atardecer",
    "imageUrl": "...",
    "dimensions": "80x60 cm",
    "technique": "Óleo sobre lienzo",
    "year": 2024,
    "collection": { "id": 1, "title": "Óleos" }
  }
}
```

**POST/PUT /api/v1/admin/paintings**
```json
// Request (multipart/form-data)
{
  "title": "Atardecer",
  "dimensions": "80x60 cm",
  "technique": "Óleo sobre lienzo",
  "year": 2024,
  "collectionId": 1,
  "isFeatured": false,
  "isPublished": true,
  "image": <File>
}
```

---

## 5. Exposiciones (HU05, HU07)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/exhibitions` | Listar exposiciones ordenadas por position | No |
| `POST` | `/api/v1/admin/exhibitions` | Crear exposición | Admin |
| `PUT` | `/api/v1/admin/exhibitions/:id` | Editar exposición | Admin |
| `DELETE` | `/api/v1/admin/exhibitions/:id` | Eliminar exposición | Admin |
| `PUT` | `/api/v1/admin/exhibitions/reorder` | Reordenar exposiciones | Admin |

**GET /api/v1/exhibitions**
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Muestra Colectiva 2024",
      "date": "2024-06-15",
      "location": "Galería Central, Madrid",
      "description": "Exposición colectiva de arte contemporáneo",
      "position": 1
    }
  ]
}
```

**POST/PUT /api/v1/admin/exhibitions**
```json
// Request
{
  "title": "Muestra Colectiva 2024",
  "date": "2024-06-15",
  "location": "Galería Central, Madrid",
  "description": "...",
  "position": 1
}
```

---

## 6. Diseño (HU08, HU10)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/design` | Listar proyectos de diseño | No |
| `GET` | `/api/v1/design?subcategory=packaging-expositores` | Filtrar por subcategoría | No |
| `POST` | `/api/v1/admin/design` | Crear proyecto de diseño | Admin |
| `PUT` | `/api/v1/admin/design/:id` | Editar proyecto de diseño | Admin |
| `DELETE` | `/api/v1/admin/design/:id` | Eliminar proyecto de diseño | Admin |

**Subcategorías válidas:** `imagen-corporativa`, `packaging-expositores`, `carteleria`, `editorial`

**GET /api/v1/design**
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Branding Café Aroma",
      "category": "imagen-corporativa",
      "subcategory": "imagen-corporativa",
      "imageUrl": "...",
      "description": "Proyecto de identidad visual"
    }
  ]
}
```

---

## 7. Ilustración (HU09, HU10)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/illustrations` | Galería de ilustraciones | No |
| `POST` | `/api/v1/admin/illustrations` | Crear ilustración | Admin |
| `PUT` | `/api/v1/admin/illustrations/:id` | Editar ilustración | Admin |
| `DELETE` | `/api/v1/admin/illustrations/:id` | Eliminar ilustración | Admin |

**GET /api/v1/illustrations**
```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Bosque Encantado",
      "imageUrl": "...",
      "description": "Ilustración digital"
    }
  ]
}
```

---

## 8. Biografía (HU11, HU12)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/biography` | Obtener biografía | No |
| `POST` | `/api/v1/admin/biography` | Crear biografía | Admin |
| `PUT` | `/api/v1/admin/biography` | Actualizar biografía | Admin |

**GET /api/v1/biography**
```json
// Response 200
{
  "data": {
    "id": 1,
    "content": "Texto plano de la biografía del artista...",
    "imageUrl": "https://res.cloudinary.com/.../portrait.jpg",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**POST /api/v1/admin/biography**
```json
// Request (multipart/form-data)
{
  "content": "Biografía del artista...",
  "image": <File>
}
```

**PUT /api/v1/admin/biography**
```json
// Request (multipart/form-data)
{
  "content": "Nueva biografía actualizada...",
  "image": <File>  // opcional, solo si se cambia
}
```

---

## 9. Contacto (HU13, HU14, HU15)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/contact` | Enviar mensaje (rate limited: 5 req/min) | No |

**POST /api/v1/contact**
```json
// Request
{
  "name": "Juan García",
  "email": "juan@ejemplo.com",
  "subject": "Consulta sobre obra",
  "message": "Me interesa la pieza..."
}

// Response 201
{ "data": { "message": "Mensaje enviado correctamente" } }

// Error 429
{ "error": "Demasiadas peticiones. Intenta de nuevo en 1 minuto.", "code": "RATE_LIMITED" }
```

**Flujo interno (HU14):** El endpoint NO almacena en DB. Usa Nodemailer para enviar un email directo a la bandeja del admin.

---

## 10. Upload de Archivos (HU16)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/admin/upload` | Subir imagen (Multer + Cloudinary) | Admin |

**POST /api/v1/admin/upload**
```json
// Request: multipart/form-data
// field: "file" (image/jpeg, image/png, image/webp)

// Response 200
{
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
    "width": 1200,
    "height": 800,
    "format": "jpg"
  }
}
```

---

## 12. Salud del Sistema (HU19)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/health` | Estado del servidor | No |

**GET /api/v1/health**
```json
// Response 200
{ "status": "ok", "timestamp": "2024-01-15T10:30:00Z" }
```

---

## Resumen de Endpoints

| # | Método | Ruta | HU | Auth |
|---|--------|------|----|------|
| 1 | `POST` | `/api/v1/auth/register` | - | No |
| 2 | `POST` | `/api/v1/auth/login` | HU20 | No |
| 3 | `GET` | `/api/v1/admin/users` | - | Admin |
| 4 | `GET` | `/api/v1/admin/users/:id` | - | Admin |
| 5 | `PUT` | `/api/v1/admin/users/:id` | - | Admin |
| 6 | `DELETE` | `/api/v1/admin/users/:id` | - | Admin |
| 7 | `PUT` | `/api/v1/admin/users/:id/password` | - | Admin |
| 8 | `GET` | `/api/v1/health` | HU19 | No |
| 9 | `GET` | `/api/v1/collections` | HU01 | No |
| 10 | `GET` | `/api/v1/collections/:id` | HU02 | No |
| 11 | `POST` | `/api/v1/admin/collections` | HU06 | Admin |
| 12 | `PUT` | `/api/v1/admin/collections/:id` | HU06 | Admin |
| 13 | `DELETE` | `/api/v1/admin/collections/:id` | HU06 | Admin |
| 14 | `PUT` | `/api/v1/admin/collections/reorder` | HU06 | Admin |
| 15 | `GET` | `/api/v1/paintings/featured` | HU04 | No |
| 16 | `GET` | `/api/v1/paintings/:id` | HU03 | No |
| 17 | `POST` | `/api/v1/admin/paintings` | HU06 | Admin |
| 18 | `PUT` | `/api/v1/admin/paintings/:id` | HU06 | Admin |
| 19 | `DELETE` | `/api/v1/admin/paintings/:id` | HU06 | Admin |
| 20 | `PUT` | `/api/v1/admin/paintings/:id/feature` | HU06 | Admin |
| 21 | `PUT` | `/api/v1/admin/paintings/:id/publish` | HU06 | Admin |
| 22 | `PUT` | `/api/v1/admin/paintings/reorder` | HU06 | Admin |
| 23 | `GET` | `/api/v1/exhibitions` | HU05 | No |
| 24 | `POST` | `/api/v1/admin/exhibitions` | HU07 | Admin |
| 25 | `PUT` | `/api/v1/admin/exhibitions/:id` | HU07 | Admin |
| 26 | `DELETE` | `/api/v1/admin/exhibitions/:id` | HU07 | Admin |
| 27 | `PUT` | `/api/v1/admin/exhibitions/reorder` | HU07 | Admin |
| 28 | `GET` | `/api/v1/design` | HU08 | No |
| 29 | `POST` | `/api/v1/admin/design` | HU10 | Admin |
| 30 | `PUT` | `/api/v1/admin/design/:id` | HU10 | Admin |
| 31 | `DELETE` | `/api/v1/admin/design/:id` | HU10 | Admin |
| 32 | `GET` | `/api/v1/illustrations` | HU09 | No |
| 33 | `POST` | `/api/v1/admin/illustrations` | HU10 | Admin |
| 34 | `PUT` | `/api/v1/admin/illustrations/:id` | HU10 | Admin |
| 35 | `DELETE` | `/api/v1/admin/illustrations/:id` | HU10 | Admin |
| 36 | `GET` | `/api/v1/biography` | HU11 | No |
| 37 | `POST` | `/api/v1/admin/biography` | HU12 | Admin |
| 38 | `PUT` | `/api/v1/admin/biography` | HU12 | Admin |
| 39 | `POST` | `/api/v1/contact` | HU13 | No |
| 40 | `POST` | `/api/v1/admin/upload` | HU16 | Admin |

---

## Modelos de Datos (Prisma)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  USER
}

model Collection {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  coverImage  String?
  position    Int       @default(0)
  isPublished Boolean   @default(false)
  paintings   Painting[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Painting {
  id           Int       @id @default(autoincrement())
  title        String
  imageUrl     String
  dimensions   String?
  technique    String?
  year         Int?
  isFeatured   Boolean   @default(false)
  isPublished  Boolean   @default(true)
  position     Int       @default(0)
  collectionId Int
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Exhibition {
  id          Int      @id @default(autoincrement())
  title       String
  date        DateTime
  location    String?
  description String?
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DesignProject {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  imageUrl    String
  category    String
  subcategory String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Illustration {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  imageUrl    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Biography {
  id        Int      @id @default(autoincrement())
  content   String
  imageUrl  String?
  updatedAt DateTime @updatedAt
}
```

---

## Notas de Implementación

- **HU17 (Anti-descarga):** Se resuelve en frontend (CSS `user-select: none`, bloqueo de `contextmenu`, `draggable="false"`). No requiere endpoint.
- **HU18 (SEO):** Se resuelve en frontend con meta tags dinámicos por página. No requiere endpoint.
- **HU15 (Rate limiting):** Aplicar `express-rate-limit` en `POST /api/v1/contact` con `windowMs: 60000` y `max: 5`.
- **HU14 (Email):** Nodemailer con transporter SMTP, sin persistencia en DB.
- **HU16 (Upload):** Multer (memory storage) → Cloudinary upload → retornar URLs optimizadas.

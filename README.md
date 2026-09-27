# Portfolio Antonio Tello - Backend API

API REST para la gestión del portfolio artístico. Permite la administración de colecciones, pinturas, exposiciones, diseño, ilustraciones, biografía y contacto.

## Stack tecnológico

- **Runtime**: Node.js >= 18 + Express 5
- **ORM**: Prisma
- **Base de datos**: PostgreSQL 16 (Docker)
- **Testing**: Vitest + Supertest (100% cobertura obligatoria)
- **Gestor de paquetes**: pnpm
- **CI/CD**: GitHub Actions
- **Especificación de API**: OpenAPI 3.0.3 (`docs/openapi.yaml`)
- **Email**: Resend (producción) / Nodemailer SMTP (desarrollo)
- **Almacenamiento**: Cloudinary
- **Logging**: Winston · **Errores**: Sentry (opcional)

## Inicio rápido

### Requisitos previos

- Node.js >= 18
- Docker + Docker Compose
- pnpm

### Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/htello/web-tello-2026-server.git
cd web-tello-2026-server

# 2. Arranca PostgreSQL (expone el puerto 5433 en el host)
docker compose up -d

# 3. Instala las dependencias
pnpm install

# 4. Crea el archivo .env
cp .env.example .env
# Edita .env con tus credenciales

# 5. Ejecuta las migraciones
pnpm exec prisma migrate dev

# 6. Poblar la base de datos (seed)
pnpm exec prisma db seed

# 7. Arranca el servidor de desarrollo (auto-reload)
pnpm run dev
```

El servidor arranca en `http://localhost:3000`.

> **Producción:** `pnpm start` (ejecuta `node --env-file=.env src/app.js`). El punto de entrada es `src/app.js`.

## Variables de entorno

Copia `.env.example` en `.env` y completa los valores. Variables reconocidas:

```env
# Base de datos (puerto 5433 mapeado por docker compose)
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5433/portfolio_db

# Autenticación
JWT_SECRET=tu-clave-secreta-aqui-minimo-32-caracteres

# Frontend (base para enlaces de email, p. ej. recuperación de contraseña)
FRONTEND_URL=http://localhost:5173

# CORS: origen del frontend permitido
CORS_ORIGIN=http://localhost:5173

# Cloudinary (upload de imágenes)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email — vía Resend (obligatoria en Render free: bloquea SMTP 25/465/587)
# Si RESEND_API_KEY está definida se usa Resend; si no, SMTP (desarrollo local)
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev

# Email — vía SMTP (Nodemailer, fallback para desarrollo local)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Logging
LOG_LEVEL=info

# Sentry (opcional)
SENTRY_DSN=
SENTRY_RELEASE=

# Puerto del servidor
PORT=3000
```

## Endpoints de la API

### URL base

```
http://localhost:3000/api/v1
```

- **Auth** = cabecera `Authorization: Bearer <JWT>` con rol `ADMIN`.
- Las rutas de escritura de pinturas, diseño, ilustraciones y biografía aceptan **multipart/form-data** con campo de imagen `image` (archivo o `imageUrl`).
- Respuesta de error estándar: `{ "error": "...", "code": "..." }`.

### Health

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Estado del servidor y timestamp | No |
| GET | `/health/db` | 200 si la BD responde, 503 en caso contrario | No |

### Autenticación y usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login, retorna JWT (10 req/min) | No |
| POST | `/auth/forgot-password` | Solicita enlace de recuperación (5 req/15min) | No |
| POST | `/auth/reset-password` | Nueva contraseña con token (5 req/15min) | No |
| POST | `/admin/users/register` | Registra nuevo admin | Admin JWT |
| GET | `/admin/users` | Listar usuarios | Admin JWT |
| GET | `/admin/users/:id` | Detalle de usuario | Admin JWT |
| PUT | `/admin/users/:id` | Editar usuario | Admin JWT |
| DELETE | `/admin/users/:id` | Eliminar usuario | Admin JWT |
| PUT | `/admin/users/:id/password` | Resetear contraseña | Admin JWT |

### Colecciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/collections` | Listar colecciones publicadas | No |
| GET | `/collections/:id` | Detalle de colección con pinturas | No |
| GET | `/admin/collections` | Listar todas las colecciones | JWT |
| POST | `/admin/collections` | Crear colección | JWT |
| PUT | `/admin/collections/reorder` | Reordenar colecciones | JWT |
| PUT | `/admin/collections/:id` | Actualizar colección | JWT |
| DELETE | `/admin/collections/:id` | Eliminar colección | JWT |

### Pinturas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/paintings` | Listar pinturas publicadas | No |
| GET | `/paintings/featured` | Obras destacadas (homepage) | No |
| GET | `/paintings/:id` | Ficha de pintura | No |
| GET | `/admin/paintings?collectionId=<id>` | Listar todas las pinturas (filtro opcional) | JWT |
| POST | `/admin/paintings` | Crear pintura (multipart) | JWT |
| PUT | `/admin/paintings/reorder` | Reordenar pinturas | JWT |
| PUT | `/admin/paintings/:id` | Actualizar pintura (incluye toggles destacada/publicada) | JWT |
| DELETE | `/admin/paintings/:id` | Eliminar pintura | JWT |

### Exposiciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/exhibitions` | Listar exposiciones publicadas | No |
| GET | `/admin/exhibitions` | Listar todas las exposiciones | JWT |
| POST | `/admin/exhibitions` | Crear exposición | JWT |
| PUT | `/admin/exhibitions/reorder` | Reordenar exposiciones | JWT |
| PUT | `/admin/exhibitions/:id` | Actualizar exposición | JWT |
| DELETE | `/admin/exhibitions/:id` | Eliminar exposición | JWT |

### Diseño

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/design?subcategory=<slug>` | Listar proyectos publicados (subcategoría obligatoria) | No |
| GET | `/design/featured` | Proyectos de diseño destacados | No |
| GET | `/admin/design?subcategory=<slug>` | Listar todos los proyectos (filtro opcional) | JWT |
| POST | `/admin/design` | Crear proyecto (multipart) | JWT |
| PUT | `/admin/design/reorder` | Reordenar proyectos | JWT |
| PUT | `/admin/design/:id` | Actualizar proyecto | JWT |
| DELETE | `/admin/design/:id` | Eliminar proyecto | JWT |

Subcategorías válidas (`subcategory`): `imagen-corporativa`, `packaging-expositores`, `carteleria`, `editorial`.

### Ilustraciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/illustrations` | Listar ilustraciones publicadas | No |
| GET | `/illustrations/featured` | Ilustraciones destacadas | No |
| GET | `/admin/illustrations` | Listar todas las ilustraciones | JWT |
| POST | `/admin/illustrations` | Crear ilustración (multipart) | JWT |
| PUT | `/admin/illustrations/reorder` | Reordenar ilustraciones | JWT |
| PUT | `/admin/illustrations/:id` | Actualizar ilustración | JWT |
| DELETE | `/admin/illustrations/:id` | Eliminar ilustración | JWT |

### Biografía

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/biography` | Obtener biografía | No |
| POST | `/admin/biography` | Crear biografía (multipart) | JWT |
| PUT | `/admin/biography` | Actualizar biografía (multipart) | JWT |

### Contacto y subida de archivos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/contact` | Enviar mensaje de contacto (5 req/min) | No |
| POST | `/admin/upload` | Subir imagen a Cloudinary (campo `file`) | JWT |

## Formato de petición/respuesta

### Éxito (200, 201)

```json
{
  "data": {
    "id": 1,
    "title": "Óleos"
  }
}
```

### Éxito con paginación

Los listados admiten `?page=` y `?limit=` (por defecto `limit=20`, máximo `100`).

```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Error (400, 401, 403, 404, 429, 500, 502, 503)

```json
{
  "error": "Mensaje descriptivo",
  "code": "VALIDATION_ERROR"
}
```

### Códigos de error

| Código | Estado HTTP | Descripción |
|--------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Datos de entrada inválidos |
| `DUPLICATE_ERROR` | 400 | Violación de constraint único |
| `UNAUTHORIZED` | 401 | Token ausente o inválido |
| `FORBIDDEN` | 403 | Permisos insuficientes |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `RATE_LIMITED` | 429 | Demasiadas peticiones |
| `INTERNAL_ERROR` | 500 | Error del servidor |
| `EMAIL_ERROR` | 502 | Fallo al enviar el email |
| `SERVICE_UNAVAILABLE` | 503 | Base de datos no disponible |

## Pruebas

```bash
# Todos los tests
pnpm test

# Un test concreto
pnpm test -- tests/integration/hu-01-gallery.test.js

# Modo watch
pnpm run test:watch

# Reporte de cobertura
pnpm run test:coverage
```

**Requisito de cobertura**: 100% (CI/CD falla si no se cumple).

## Desarrollo

```bash
# Servidor de desarrollo (auto-reload)
pnpm run dev

# Linting
pnpm run lint
pnpm run lint:fix

# Operaciones de base de datos
pnpm exec prisma migrate dev    # Crear migración
pnpm exec prisma generate       # Regenerar cliente Prisma
pnpm exec prisma db seed        # Poblar base de datos
pnpm exec prisma studio         # Abrir Prisma Studio
```

## Docker

```bash
# Arrancar PostgreSQL
docker compose up -d

# Detener PostgreSQL
docker compose down

# Ver logs
docker compose logs -f db
```

## Seguridad

- Autenticación JWT para rutas admin (expiración 24h, bcrypt 12 rondas)
- Rate limiting: contacto 5/min, login 10/min, recuperación de contraseña 5/15min
- Helmet.js para cabeceras HTTP
- Validación de entrada con Joi en todos los endpoints
- Prevención de inyección SQL vía Prisma
- Configuración CORS (origen en `CORS_ORIGIN`)
- Secrets en variables de entorno (nunca hardcodeados)
- Logger Winston: no registra passwords, tokens ni datos sensibles

## Documentación de la API

La especificación completa OpenAPI 3.0.3 está en `docs/openapi.yaml` (fuente de verdad).

Puedes visualizarla con:
- [Swagger Editor](https://editor.swagger.io/)
- [Redocly](https://redocly.github.io/redoc/)
- VS Code con la extensión OpenAPI

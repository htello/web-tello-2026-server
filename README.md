# Portfolio Antonio Tello - Backend API

API REST para la gestión del portfolio artístico. Permite la administración de colecciones, pinturas, exposiciones, diseño, ilustraciones, biografía y contacto.

## Tech Stack

- **Runtime**: Node.js + Express 5
- **ORM**: Prisma
- **Database**: PostgreSQL 16 (Docker)
- **Testing**: Vitest (100% cobertura obligatoria)
- **Package Manager**: pnpm
- **CI/CD**: GitHub Actions
- **API Spec**: OpenAPI 3.0.3

## Quick Start

### Prerequisites

- Node.js >= 18
- Docker + Docker Compose
- pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/user/portfolio-tello.git
cd portfolio-tello/server

# 2. Start PostgreSQL
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 5. Run migrations
pnpm exec prisma migrate dev --name init

# 6. Seed database
pnpm exec prisma db seed

# 7. Start development server
pnpm run dev
```

The server will start at `http://localhost:3000`

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio_db

# Authentication
JWT_SECRET=your-secret-key-min-32-chars

# Cloudinary (image uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info

# Sentry (optional)
SENTRY_DSN=https://...@sentry.io/...
```

## API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |

### Collections (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/collections` | List published collections | No |
| GET | `/collections/{id}` | Collection detail with paintings | No |

### Collections (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/collections` | Create collection | JWT |
| PUT | `/admin/collections/{id}` | Update collection | JWT |
| DELETE | `/admin/collections/{id}` | Delete collection | JWT |
| PUT | `/admin/collections/reorder` | Reorder collections | JWT |

### Paintings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/paintings/featured` | Featured paintings (homepage) | No |
| GET | `/paintings/{id}` | Painting detail | No |
| POST | `/admin/paintings` | Create painting | JWT |
| PUT | `/admin/paintings/{id}` | Update painting | JWT |
| DELETE | `/admin/paintings/{id}` | Delete painting | JWT |
| PUT | `/admin/paintings/{id}/feature` | Toggle featured | JWT |
| PUT | `/admin/paintings/{id}/publish` | Toggle published | JWT |
| PUT | `/admin/paintings/reorder` | Reorder paintings | JWT |

### Exhibitions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/exhibitions` | List exhibitions | No |
| POST | `/admin/exhibitions` | Create exhibition | JWT |
| PUT | `/admin/exhibitions/{id}` | Update exhibition | JWT |
| DELETE | `/admin/exhibitions/{id}` | Delete exhibition | JWT |
| PUT | `/admin/exhibitions/reorder` | Reorder exhibitions | JWT |

### Design

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/design` | List design projects | No |
| POST | `/admin/design` | Create design project | JWT |
| PUT | `/admin/design/{id}` | Update design project | JWT |
| DELETE | `/admin/design/{id}` | Delete design project | JWT |

### Illustrations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/illustrations` | List illustrations | No |
| POST | `/admin/illustrations` | Create illustration | JWT |
| PUT | `/admin/illustrations/{id}` | Update illustration | JWT |
| DELETE | `/admin/illustrations/{id}` | Delete illustration | JWT |

### Biography

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/biography` | Get biography | No |
| POST | `/admin/biography` | Create biography | JWT |
| PUT | `/admin/biography` | Update biography | JWT |

### Other

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/contact` | Send contact message | No |
| POST | `/admin/upload` | Upload image | JWT |
| GET | `/health` | Health check | No |

## Request/Response Format

### Success (200, 201)

```json
{
  "data": {
    "id": 1,
    "title": "Óleos"
  }
}
```

### Success with Pagination

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Error (400, 401, 403, 404, 429, 500)

```json
{
  "error": "Mensaje descriptivo",
  "code": "VALIDATION_ERROR"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- tests/unit/hu-01-gallery.test.js

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage
```

**Coverage requirement**: 100% (CI/CD will fail otherwise)

## Development

```bash
# Start dev server (auto-reload)
pnpm run dev

# Run linting
pnpm run lint

# Database operations
pnpm exec prisma migrate dev    # Create migration
pnpm exec prisma generate       # Regenerate Prisma client
pnpm exec prisma db seed        # Seed database
pnpm exec prisma studio         # Open Prisma Studio
```

## Docker

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# View logs
docker compose logs -f postgres
```

## Security

- JWT authentication for admin routes
- Rate limiting: 5 req/min (contact), 10 req/min (login)
- Helmet.js for HTTP headers
- Input validation on all endpoints
- SQL injection prevention via Prisma
- CORS configuration
- Environment variables for secrets

## API Documentation

Full OpenAPI 3.0.3 specification is available at `docs/openapi.yaml`.

You can view it using:
- [Swagger Editor](https://editor.swagger.io/)
- [Redocly](https://redocly.github.io/redoc/)
- VS Code with OpenAPI extension

## License

MIT

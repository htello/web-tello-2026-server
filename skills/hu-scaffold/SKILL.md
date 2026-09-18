---
name: hu-scaffold
description: Scaffold a new user story (HU) implementation with tests first. Use this skill whenever starting a new HU from the product backlog (HU01-HU21). This skill enforces TDD by creating the test file BEFORE any implementation. Triggers on: "empezar HU", "implementar HU01", "HU02", "nueva HU", "siguiente HU", "next HU", or any request to start work on a specific user story.
---

# HU Scaffold

Scaffold new HU implementations following strict TDD.

## Before Starting

1. Read the HU details from `docs/0001-API-DESIGN.md`
2. Identify what needs to be tested (unit vs integration)
3. Check the mape HU → Test in AGENTS.md for the correct file path

## Step 1: Create Test File FIRST

```bash
# For unit tests
touch tests/unit/hu-XX-feature-name.test.js

# For integration tests
touch tests/integration/hu-XX-feature-name.test.js
```

## Step 2: Write Test Skeleton

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    // Add models needed for this HU
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

// Import controller/service/route AFTER mocking
import { getAll } from '../../src/controllers/resource.js';

describe('HUXX - Nombre de la HU', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('given [condition]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      prisma.resource.findMany.mockResolvedValue([]);

      // Act
      await getAll(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('given [error condition]', () => {
    it('should return 500 on error', async () => {
      // Arrange
      prisma.resource.findMany.mockRejectedValue(new Error('DB Error'));

      // Act
      await getAll(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
```

## Step 3: Run Test — Verify RED

```bash
pnpm test tests/unit/hu-XX-feature-name.test.js
```

The test MUST fail because the implementation doesn't exist yet.

## Step 4: Create Minimal Implementation

Create only what's needed to make the test pass:

```javascript
// src/controllers/resource.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const items = await prisma.resource.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { getAll };
```

## Step 5: Run Test — Verify GREEN

```bash
pnpm test tests/unit/hu-XX-feature-name.test.js
```

All tests must pass.

## Step 6: Refactor

- Extract magic strings to constants
- Improve naming
- Remove duplication
- Run tests after EACH change

## Step 7: Verify Coverage

```bash
pnpm run test:coverage -- --collectCoverageFrom='src/controllers/resource.js'
```

Must be 100%.

## Step 8: Security Check (OWASP)

Before marking a HU as complete, verify:

- [ ] **A01 - Access Control**: Admin routes use `authenticate` middleware
- [ ] **A02 - Misconfiguration**: No hardcoded secrets, `.env` not committed
- [ ] **A04 - Crypto**: Passwords hashed with bcrypt (12 rounds), JWT secrets ≥32 chars
- [ ] **A05 - Injection**: Input validated with Joi/Zod, Prisma for DB queries
- [ ] **A07 - Auth**: Rate limiting on login (10 req/min), password policy enforced
- [ ] **A10 - Errors**: Try/catch in all handlers, generic error messages to client

## Step 9: Verify + Commit

```bash
# ANTES de commit, verificar:
pnpm test                    # Todos los tests pasan
pnpm run lint                # Sin errores ESLint
pnpm run test:coverage       # Cobertura verificada
```

**Reglas:**
- **NO hacer commit** sin que tests + lint pasen
- **NO hacer push ni merge** sin confirmación explícita del usuario
- Actualizar `CHANGELOG.md` antes del commit

```bash
git add .
git commit -m "feat(hu-XX): implement [brief description]"
```

Después del commit, esperar aprobación del usuario para push/merge.

## HU Reference Table

| HU | Nombre | Tipo Test | Archivo |
|----|--------|-----------|---------|
| HU01 | Galería de Colecciones | Unit | `tests/unit/hu-01-gallery.test.js` |
| HU02 | Detalle de Colección | Unit | `tests/unit/hu-02-collection-detail.test.js` |
| HU03 | Ficha de Pintura | Unit | `tests/unit/hu-03-painting-card.test.js` |
| HU04 | Obras Destacadas y Lightbox | Unit | `tests/unit/hu-04-featured-lightbox.test.js` |
| HU05 | Exposiciones | Unit | `tests/unit/hu-05-exhibitions.test.js` |
| HU06 | Gestión Colecciones (Admin) | Integration | `tests/integration/hu-06-admin-collections.test.js` |
| HU07 | Gestión Exposiciones (Admin) | Integration | `tests/integration/hu-07-admin-exhibitions.test.js` |
| HU08 | Filtrar Diseño | Unit | `tests/unit/hu-08-design-filter.test.js` |
| HU09 | Galería Ilustración | Unit | `tests/unit/hu-09-illustration-gallery.test.js` |
| HU10 | Gestión Diseño (Admin) | Integration | `tests/integration/hu-10-admin-design.test.js` |
| HU11 | Leer Biografía | Unit | `tests/unit/hu-11-biography.test.js` |
| HU12 | Editar Biografía (Admin) | Integration | `tests/integration/hu-12-admin-biography.test.js` |
| HU13 | Enviar Formulario | Integration | `tests/integration/hu-13-contact-form.test.js` |
| HU14 | Envío por Email | Unit | `tests/unit/hu-14-email-service.test.js` |
| HU15 | Protección Anti-Spam | Unit | `tests/unit/hu-15-rate-limit.test.js` |
| HU16 | Carga de Archivos | Integration | `tests/integration/hu-16-file-upload.test.js` |
| HU17 | Protección Anti-Descarga | Unit | `tests/unit/hu-17-download-protection.test.js` |
| HU18 | Metadatos SEO | Unit | `tests/unit/hu-18-seo-meta.test.js` |
| HU19 | Health Check | Integration | `tests/integration/hu-19-health-check.test.js` |
| HU20 | Login Admin | Integration | `tests/integration/hu-20-auth-login.test.js` |
| HU21 | Protección Rutas | Integration | `tests/integration/hu-21-route-protection.test.js` |

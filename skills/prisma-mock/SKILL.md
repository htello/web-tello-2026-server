---
name: prisma-mock
description: Mock Prisma client correctly in Vitest tests. Use this skill whenever writing tests that interact with the database, testing controllers, services, or routes that use Prisma. Triggers on: "test con prisma", "mock prisma", "prisma test", "database mock", "mock base de datos", or any test file that imports or uses @prisma/client.
---

# Prisma Mock Helper

Correct patterns for mocking Prisma in Vitest tests.

## Why Prisma Mocking is Hard

Prisma Client is generated code with a complex object structure. Simple `vi.mock()` doesn't work because:
- `prisma.user.findMany()` returns a chainable query builder
- Methods return promises
- Nested relations need nested mocks

## Standard Mock Pattern

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// At the TOP of your test file, BEFORE any imports
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    painting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Add other models as needed
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

const { PrismaClient } = await import('@prisma/client');
let prisma;

beforeEach(() => {
  prisma = new PrismaClient();
  vi.clearAllMocks();
});
```

## Mocking Responses

```javascript
// For findMany (returns array)
prisma.painting.findMany.mockResolvedValue([
  { id: 1, title: 'Test Painting', isPublished: true },
]);

// For findUnique (returns single object or null)
prisma.user.findUnique.mockResolvedValue({
  id: 1,
  email: 'admin@test.com',
});

// For create (returns created object)
prisma.painting.create.mockResolvedValue({
  id: 1,
  title: 'New Painting',
  ...inputData,
});

// For update (returns updated object)
prisma.painting.update.mockResolvedValue({
  id: 1,
  title: 'Updated Title',
});

// For delete (returns deleted object)
prisma.painting.delete.mockResolvedValue({ id: 1 });

// For errors
prisma.painting.create.mockRejectedValue(
  new Error('Unique constraint failed')
);
```

## Testing Controllers

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPainting } from '../../src/controllers/paintings.js';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('@prisma/client', () => {
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

describe('HU06 - Gestión de Colecciones', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: { title: 'Test', technique: 'Óleo' },
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should create a painting', async () => {
    mockPrisma.painting.create.mockResolvedValue({ id: 1, ...req.body });

    await createPainting(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test' })
    );
  });
});
```

## Testing Services (with dependencies)

```javascript
import { describe, it, expect, vi } from 'vitest';
import { sendContactEmail } from '../../src/services/email.js';

vi.mock('../../src/services/email.js', () => ({
  sendEmail: vi.fn(),
}));

import { sendEmail } from '../../src/services/email.js';

describe('HU14 - Envío por Email', () => {
  it('should send email on contact form submit', async () => {
    sendEmail.mockResolvedValue({ success: true });

    const result = await sendContactEmail({
      name: 'Test',
      email: 'test@test.com',
      subject: 'Hello',
      message: 'World',
    });

    expect(result.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: expect.any(String) })
    );
  });
});
```

## Verification

After writing Prisma mocks, verify:

- [ ] Mock is defined BEFORE imports
- [ ] `vi.clearAllMocks()` in `beforeEach`
- [ ] Every Prisma method used in code has a mock
- [ ] Mock responses match Prisma schema types
- [ ] Tests pass with `pnpm test`

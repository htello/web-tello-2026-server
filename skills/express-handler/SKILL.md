---
name: express-handler
description: Create Express route handlers with proper patterns for this portfolio project. Use this skill whenever creating routes, controllers, or middleware. Triggers on: "crear ruta", "nuevo endpoint", "express route", "api endpoint", "controlador", "middleware", or any task involving Express.js route handling.
---

# Express Handler Patterns

Standard patterns for Express routes in this project.

## Route Structure

```
src/
├── routes/
│   ├── index.js           # Main router
│   ├── paintings.js       # /api/paintings
│   ├── collections.js     # /api/collections
│   ├── exhibitions.js     # /api/exhibitions
│   ├── design.js          # /api/design
│   ├── illustration.js    # /api/illustration
│   ├── biography.js       # /api/biography
│   ├── contact.js         # /api/contact
│   └── auth.js            # /api/auth
├── controllers/           # Business logic
├── middleware/            # Auth, validation, rate-limit
└── services/             # Email, upload
```

## Route File Template

```javascript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/resource.js';

const router = Router();

// Public routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Protected routes (admin only)
router.post('/', authenticate, validate(schemas.create), controller.create);
router.put('/:id', authenticate, validate(schemas.update), controller.update);
router.delete('/:id', authenticate, controller.remove);

export default router;
```

## Controller Pattern

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/resource
const getAll = async (req, res) => {
  try {
    const items = await prisma.resource.findMany({
      where: { isPublished: true },
      orderBy: { position: 'asc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/resource/:id
const getById = async (req, res) => {
  try {
    const item = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/resource
const create = async (req, res) => {
  try {
    const item = await prisma.resource.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/resource/:id
const update = async (req, res) => {
  try {
    const item = await prisma.resource.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/resource/:id
const remove = async (req, res) => {
  try {
    await prisma.resource.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(400).json({ error: error.message });
  }
};

export { getAll, getById, create, update, remove };
```

## Auth Middleware

```javascript
import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

export { authenticate };
```

## Validation Middleware (with Joi)

```javascript
import Joi from 'joi';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Schemas
const paintingSchema = Joi.object({
  title: Joi.string().required(),
  dimensions: Joi.string().allow(null, ''),
  technique: Joi.string().allow(null, ''),
  year: Joi.number().integer().allow(null),
  isPublished: Joi.boolean(),
  isFeatured: Joi.boolean(),
  position: Joi.number().integer(),
  collectionId: Joi.number().integer().required(),
});

export { validate, paintingSchema };
```

## Testing Routes with Supertest

```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/paintings', () => {
  it('should return published paintings', async () => {
    const res = await request(app)
      .get('/api/paintings')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

## Security (OWASP)

### App Setup with Security Headers

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Security headers (A02)
app.use(helmet());
app.disable('x-powered-by');

// CORS (A01)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing with limits (A05)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

### Rate Limiting (A01, A07)

```javascript
import rateLimit from 'express-rate-limit';

// Contact form: 5 req/min per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests', code: 'RATE_LIMIT' },
});

// Login: 10 req/min per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts', code: 'RATE_LIMIT' },
});

app.use('/api/contact', contactLimiter);
app.use('/api/auth/login', loginLimiter);
```

### Secure Error Handling (A10)

```javascript
// NEVER expose stack traces to client
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log server-side only

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
};

app.use(errorHandler);
```

### Input Sanitization (A05)

```javascript
import validator from 'validator';

const sanitize = (str) => validator.escape(str);

// In controller
const create = async (req, res) => {
  const sanitized = {
    title: sanitize(req.body.title),
    description: sanitize(req.body.description),
  };
  // Use sanitized data with Prisma
};
```

### File Upload Security (A01, A05)

```javascript
import multer from 'multer';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});
```

## Verification

- [ ] Routes use proper HTTP methods (GET, POST, PUT, DELETE)
- [ ] Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error
- [ ] Protected routes use `authenticate` middleware
- [ ] Input validation on POST/PUT routes
- [ ] Error handling in every controller method
- [ ] Tests use supertest for integration tests
- [ ] helmet.js enabled in app setup
- [ ] CORS configured with explicit origins
- [ ] Rate limiting on contact and login endpoints
- [ ] No stack traces in production responses
- [ ] File uploads validate type and size

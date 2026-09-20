import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import app from '../../src/app.js';
import routes from '../../src/routes/index.js';
import authRoutes from '../../src/routes/auth.js';
import adminRoutes from '../../src/routes/admin.js';
import collectionsRouter, { publicRouter } from '../../src/routes/collections.js';
import uploadRoutes from '../../src/routes/upload.js';
import paintingsRoutes, { publicRouter as paintingsPublicRouter } from '../../src/routes/paintings.js';
import exhibitionsRoutes, { publicRouter as exhibitionsPublicRouter } from '../../src/routes/exhibitions.js';
import designRoutes from '../../src/routes/design.js';
import illustrationsRoutes from '../../src/routes/illustrations.js';
import biographyRoutes from '../../src/routes/biography.js';

const ROOT = path.resolve(process.cwd());

const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Espejo de router.use('/x', r) y app.use('/x', r). Se resuelve por identidad
// de objeto para reconstruir la ruta completa de cada endpoint.
const MOUNTS = new Map([
  [routes, '/api/v1'],
  [authRoutes, '/auth'],
  [publicRouter, '/collections'],
  [adminRoutes, '/admin'],
  [uploadRoutes, '/upload'],
  [collectionsRouter, '/collections'],
  [paintingsRoutes, '/paintings'],
  [paintingsPublicRouter, '/paintings'],
  [exhibitionsRoutes, '/exhibitions'],
  [exhibitionsPublicRouter, '/exhibitions'],
  [designRoutes, '/design'],
  [illustrationsRoutes, '/illustrations'],
  [biographyRoutes, '/biography'],
]);

const normalizePath = (fullPath) =>
  fullPath
    .replace(/\/+$/, '')
    .replace(/^\/api\/v1/, '')
    .replace(/:([A-Za-z]+)/g, '{$1}');

const collectRoutes = (stack, base = '') => {
  const result = [];

  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        result.push({ method, path: normalizePath(base + layer.route.path) });
      }
    } else if (layer.handle && layer.handle.stack) {
      const mount = MOUNTS.get(layer.handle);
      if (mount !== undefined) {
        result.push(...collectRoutes(layer.handle.stack, base + mount));
      }
    }
  }

  return result;
};

const implementedRoutes = collectRoutes(app.router.stack).sort((a, b) =>
  `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`)
);

const spec = parse(readFile('docs/openapi.yaml'));

describe('Consistencia OpenAPI vs implementación', () => {
  it('documenta todas las rutas implementadas en el código', () => {
    const missing = implementedRoutes.filter(
      ({ method, path: p }) => !spec.paths?.[p]?.[method]
    );

    expect(
      missing,
      `Rutas implementadas sin documentar en openapi.yaml:\n${missing
        .map(({ method, path: p }) => `- ${method.toUpperCase()} ${p}`)
        .join('\n')}`
    ).toEqual([]);
  });

  it('mantiene el enum DesignSubcategory sincronizado con Prisma', () => {
    const schema = readFile('prisma/schema.prisma');
    const match = schema.match(/enum DesignSubcategory \{([^}]*)\}/);
    const prismaValues = (match?.[1] ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort();

    const enumSources = [
      spec.components?.schemas?.DesignProject?.properties?.subcategory?.enum,
      spec.components?.schemas?.DesignRequest?.properties?.subcategory?.enum,
      spec.paths?.['/design']?.get?.parameters?.find((p) => p.name === 'subcategory')?.schema
        ?.enum,
    ];

    for (const source of enumSources) {
      expect([...(source ?? [])].sort()).toEqual(prismaValues);
    }
  });
});

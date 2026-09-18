# Orden de Implementación - Portfolio Artístico

## Fases del Proyecto

El orden importa porque hay dependencias entre historias de usuario.

### Fase 0: Setup del Proyecto

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

**Resultado**: Proyecto listo para empezar Fase 1 (Auth + Infraestructura)

### Fase 1: Auth + Infraestructura

Requerida para todo lo demás.

```
HU20 → HU22 → HU21 → HU19
```

- **HU20**: Login Admin (POST /api/v1/auth/login → JWT)
- **HU22**: Registro Admin (POST /api/v1/admin/users/register → JWT requerido, solo admins)
- **HU21**: Protección Rutas (Middleware JWT en /api/v1/admin/*)
- **HU19**: Health Check (GET /api/v1/health)

### Fase 2: Upload de Archivos

Requerida para admin CRUD de contenido con imágenes.

```
HU16
```

- **HU16**: Upload Archivos (Multer + Cloudinary)

### Fase 3: Admin CRUD de Contenido

Depende de HU16 para subir imágenes.

```
HU06 → HU07 → HU10 → HU12
```

- **HU06**: Admin Colecciones (CRUD colecciones + pinturas)
- **HU07**: Admin Exposiciones (CRUD exposiciones)
- **HU10**: Admin Diseño (CRUD diseño + ilustración)
- **HU12**: Admin Biografía (Crear/Actualizar biografía)

### Fase 4: Galería Pública

Contenido principal del portfolio. Independiente de admin.

```
HU01 → HU02 → HU03 → HU04 → HU05
```

- **HU01**: Galería de Colecciones (Listar colecciones publicadas)
- **HU02**: Detalle de Colección (Ver colección + sus pinturas)
- **HU03**: Ficha de Pintura (Ver datos técnicos)
- **HU04**: Obras Destacadas (Listar pinturas isFeatured=true)
- **HU05**: Exposiciones (Listar exposiciones por position)

### Fase 5: Diseño e Ilustración

Sección de diseño gráfico e ilustraciones.

```
HU08 → HU09
```

- **HU08**: Filtrar Diseño (Filtrar por subcategoría)
- **HU09**: Galería Ilustración (Listar ilustraciones)

### Fase 6: Resto Backend

Funcionalidades adicionales del backend.

```
HU11 → HU13 → HU14 → HU15
```

- **HU11**: Leer Biografía (Obtener contenido biográfico)
- **HU13**: Formulario Contacto (Enviar mensaje vía email)
- **HU14**: Envío Email (Nodemailer → bandeja admin)
- **HU15**: Anti-Spam (Rate limiting en contacto)

### Fase 7: Frontend-only

Sin endpoint backend. Se resuelven en el frontend.

```
HU17 → HU18
```

- **HU17**: Anti-Descarga (CSS: user-select, contextmenu, draggable)
- **HU18**: SEO Meta Tags (Open Graph dinámico)

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
│  HU20 → HU21 → HU19 │
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

## Reglas

1. **No saltar fases**: Cada fase depende de la anterior
2. **Completar fase antes de continuar**: No empezar Fase 3 sin completar Fase 2
3. **Cada HU debe tener 100% cobertura**: No avanzar sin tests pasando
4. **Fase 7 es independiente**: No requiere backend, puede hacerse en paralelo

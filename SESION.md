# Prompt para Nueva Sesión

Copia y pega esto al inicio de una nueva conversación:

```
Reanudando trabajo del proyecto Portfolio Artístico Backend.

LEE PRIMERO: AGENTS.md, docs/0002-IMPLEMENTATION-ORDER.md, docs/0001-API-DESIGN.md

ESTADO ACTUAL:
- Proyecto: Backend Node.js + Express + Prisma + PostgreSQL
- Ubicación: /Users/hectortello/Desktop/web-tello-2026/server
- Documentación completa: AGENTS.md (reglas, convenciones, skills, OWASP)
- Orden de implementación: docs/0002-IMPLEMENTATION-ORDER.md (8 fases, 0-7)
- API Design: docs/openapi.yaml (fuente de verdad)
- Fase actual: Fase 3 completada (HU06, HU07, HU10, HU12) + fixes verificados con API real
- Branch: develop (latest: 4fcc807)

ESTADO DE HUs:
✅ Fase 0: Setup del Proyecto
✅ Fase 1: Auth + Infraestructura (HU20, HU22, HU21, HU19)
✅ Fase 2: Upload de Archivos (HU16 - Multer + Cloudinary)
✅ Fase 3: Admin CRUD (HU06, HU07, HU10, HU12)
✅ Extras: Skill endpoint-tester (2 fases) + Enum DesignSubcategory + fixes P2025
⏳ Fase 4: Galería Pública (HU01 → HU02 → HU03 → HU04 → HU05) - Pendiente
⏳ Fase 5: Diseño e Ilustración (HU08 → HU09) - Pendiente
⏳ Fase 6: Resto Backend (HU11 → HU13 → HU14 → HU15) - Pendiente
⏳ Fase 7: Frontend-only (HU17 → HU18) - Pendiente

REGLAS CRÍTICAS (NO NEGOCIABLES):
1. NUNCA implementar sin aprobación explícita del usuario
2. NUNCA hacer commit ni push sin confirmación EXPLÍCITA del usuario
3. TDD estricto: RED → GREEN → REFACTOR
4. 100% cobertura obligatoria antes de avanzar HU
5. ES Modules (import/export), Vitest, pnpm
6. Comentarios y docs en español
7. Node.js --env-file=.env (NO dotenv)

CONFIGURACIÓN CLOUDINARY:
- Cloud Name: dclv58msd
- Credenciales en .env (CLOUDINARY_URL)
- Estructura: portfolio-antonio-tello/{pintura, ilustracion, diseno, general}
- Nombre original + timestamp en public_id

¿Qué hacemos hoy?
```

---

## Instrucciones de uso

1. **Al inicio de cada sesión**, pega el prompt
2. **Actualiza** la sección `[INDICAR FASE ACTUAL]` antes de pegar
3. Verifica que el servidor esté corriendo: `node --env-file=.env src/app.js`

# Prompt para Nueva Sesión

Copia y pega esto al inicio de una nueva conversación:

```
Reanudando trabajo del proyecto Portfolio Artístico Backend.

CONTEXTO DEL PROYECTO: 

Backend Node.js/Express para Portfolio Artístico.
Consulta AGENTS.md o la carpeta docs/ SOLO si necesitas detalles específicos de implementación de una HU. No leas la documentación completa para consultas simples.

ESTADO ACTUAL:
- Proyecto: Backend Node.js + Express + Prisma + PostgreSQL
- Ubicación: /Users/hectortello/Desktop/web-tello-2026/server
- Documentación completa: AGENTS.md (reglas, convenciones, skills, OWASP)
- Orden de implementación: docs/0002-IMPLEMENTATION-ORDER.md (8 fases, 0-7)
- API Design: docs/openapi.yaml (fuente de verdad)
- Fase actual: Fase 4 en progreso (HU01 implementada, sin commit)
- Branch: develop (latest: 43a44a8; working tree con cambios de HU01)

ESTADO DE HUs:
✅ Fase 0: Setup del Proyecto
✅ Fase 1: Auth + Infraestructura (HU20, HU22, HU21, HU19)
✅ Fase 2: Upload de Archivos (HU16 - Multer + Cloudinary)
✅ Fase 3: Admin CRUD (HU06, HU07, HU10, HU12)
✅ Extras: Skill endpoint-tester (2 fases) + Enum DesignSubcategory + fixes P2025
⏳ Fase 4: Galería Pública (HU01 ✅ → HU02 → HU03 → HU04 → HU05) - En progreso
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

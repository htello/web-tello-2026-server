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
- API设计: docs/openapi.yaml (fuente de verdad)
- Fase actual: [INDICAR FASE ACTUAL o "No iniciada"]

REGLAS CRÍTICAS (NO NEGOCIABLES):
1. NUNCA implementar sin aprobación explícita del usuario
2. TDD estricto: RED → GREEN → REFACTOR
3. 100% cobertura obligatoria antes de avanzar HU
4. ES Modules (import/export), Vitest, pnpm
5. Comentarios y docs en español

TAREAS PENDIENTES:
- [LISTAR TAREAS PENDIENTES]

¿Qué hacemos hoy?
```

---

## Instrucciones de uso

1. **Al inicio de cada sesión**, pega el prompt
2. **Actualiza** las secciones `[INDICAR FASE ACTUAL]` y `[LISTAR TAREAS PENDIENTES]` antes de pegar
3. Si no hay tareas pendientes, borra esa sección

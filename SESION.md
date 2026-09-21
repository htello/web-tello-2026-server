# Prompt para Nueva Sesión

Copia y pega el bloque inferior al inicio de un nuevo chat para retomar el proyecto:

```text
Reanudando trabajo en Portfolio Artístico Backend.

CONTEXTO Y DOCUMENTACIÓN:
- Backend Node.js + Express + Prisma + PostgreSQL (Docker)
- Documentación principal: AGENTS.md (Reglas críticas, TDD 100%, Git workflow, OWASP)
- Especificación API (Fuente de verdad): docs/openapi.yaml
- Orden de fases y HUs: docs/0002-IMPLEMENTATION-ORDER.md

ESTADO DEL PROYECTO:
- Rama actual: develop
- Cobertura de tests: 100% obligatorio (Vitest)
- Última HU completada y mergeada: HU13/HU14/HU15 - Formulario de Contacto + Email + Rate Limiting

ESTADO DE LAS HUS POR FASE:
✅ Fase 0: Setup del Proyecto
✅ Fase 1: Auth + Infraestructura (HU20, HU22, HU21, HU19)
✅ Fase 2: Upload de Archivos (HU16 - Multer + Cloudinary)
✅ Fase 3: Admin CRUD (HU06, HU07, HU10, HU12)
✅ Extras: Skill endpoint-tester + Enum DesignSubcategory (typo CARTELERIA corregido) + Fixes Prisma + Sync OpenAPI/docs + Test de consistencia
✅ Fase 4: Galería Pública (HU01 → HU02 → HU03 → HU04 → HU05) - COMPLETADA
✅ Fase 5: Diseño e Ilustración (HU08 → HU09) - COMPLETADA
✅ Fase 6: Resto Backend (HU11 → HU13 → HU14 → HU15) - COMPLETADA
⏳ Fase 7: Frontend-only (HU17 → HU18) - Pendiente de frontend (fuera de alcance del backend; no existe repositorio frontend aún)

REGLAS DE SESIÓN (ESTRICTAS):
1. Verificar siempre la rama antes de trabajar (`hu/XX-nombre`). NUNCA escribir código directo en `develop`.
2. Seguir TDD estricto (RED → GREEN → REFACTOR) y mantener 100% de cobertura.
3. DETENERSE y pedir aprobación antes de escribir o modificar código en el proyecto.
4. NUNCA ejecutar comandos de Git (commit/push/merge/delete) sin confirmación explícita del usuario.
5. NO escanear la base de código entera ni abrir SESION.md por iniciativa propia durante la sesión.

¿Qué Historia de Usuario abordamos hoy?
```

## Instrucciones de Mantenimiento

   - Al finalizar cada HU (Paso 6 de AGENTS.md), actualiza los checks de la sección ESTADO DE LAS HUS POR FASE en este archivo.

   - Al iniciar un chat nuevo, simplemente copia el bloque de texto superior y pégalo.
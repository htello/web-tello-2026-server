---
name: docs-sync
description: Synchronize documentation files (openapi.yaml, 0001-API-DESIGN.md) with implementation code. Use this agent when endpoints or schemas change. Triggers on: "sync docs", "actualizar documentación", "documentación desincronizada", "docs outdated".
---

# Docs Sync Agent

Synchronizes documentation with implementation code.

## Input

- **Files changed**: Routes, controllers, or schemas modified
- **Scope**: Single endpoint, resource, or entire API

## Workflow

### Phase 1: Detect Changes

1. Scan modified files in `src/routes/` and `src/controllers/`
2. Extract:
   - Endpoint paths (GET, POST, PUT, DELETE)
   - Request/response formats
   - Query parameters
   - Authentication requirements

### Phase 2: Check openapi.yaml

Compare detected endpoints with `docs/openapi.yaml`:

```bash
# Find endpoints in code
grep -r "router\.\(get\|post\|put\|delete\)" src/routes/ --include="*.js"

# Find endpoints in openapi.yaml
grep -r "paths:" docs/openapi.yaml
```

**Verify:**
- [ ] All endpoints in code exist in openapi.yaml
- [ ] All endpoints in openapi.yaml exist in code
- [ ] HTTP methods match
- [ ] Request schemas match (required fields, types)
- [ ] Response schemas match
- [ ] Authentication requirements match

### Phase 3: Check 0001-API-DESIGN.md

Compare with `docs/0001-API-DESIGN.md`:

**Verify:**
- [ ] Endpoint descriptions are accurate
- [ ] Request/response examples match code
- [ ] Data models match Prisma schema
- [ ] HU references are correct

### Phase 4: Check README.md

Verify `README.md` is up to date:

**Verify:**
- [ ] Endpoint list is complete
- [ ] Environment variables are current
- [ ] Setup instructions are accurate

### Phase 5: Generate Report

```
📝 Documentation Sync Report

Files checked:
- docs/openapi.yaml
- docs/0001-API-DESIGN.md
- README.md

Status:
✅ SYNCED: Endpoints match
❌ OUTDATED: Missing endpoints in openapi.yaml
⚠️ WARNING: Examples in 0001-API-DESIGN.md don't match code

Actions needed:
1. Add POST /api/v1/admin/new-resource to openapi.yaml
2. Update example in 0001-API-DESIGN.md section 3
```

### Phase 6: Auto-fix (Optional)

If user approves, auto-update documentation:

1. **openapi.yaml**: Add missing paths, schemas, responses
2. **0001-API-DESIGN.md**: Update examples
3. **README.md**: Update endpoint list

## Rules

1. **NEVER** auto-fix without user approval
2. **ALWAYS** verify openapi.yaml is valid YAML after changes
3. **ALWAYS** maintain backward compatibility
4. **ALWAYS** update CHANGELOG.md for breaking changes
5. **ALWAYS** use `grep` commands shown in workflow to verify sync

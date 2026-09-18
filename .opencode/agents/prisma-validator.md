---
name: prisma-validator
description: Validate Prisma schema, migrations, and seed data. Use this agent when modifying database models or when Prisma errors occur. Triggers on: "validar prisma", "prisma error", "migración", "schema invalid", "prisma validate".
---

# Prisma Validator Agent

Validates Prisma schema, migrations, and seed data.

## Input

- **Files to validate**: schema.prisma, migrations, seed.js
- **Scope**: Single change or full validation

## Workflow

### Phase 1: Schema Validation

```bash
# Validate schema syntax
pnpm exec prisma validate

# Format schema
pnpm exec prisma format

# Check for issues
pnpm exec prisma lint
```

**Verify:**
- [ ] Schema is valid Prisma syntax
- [ ] No formatting issues
- [ ] No lint warnings

### Phase 2: Model Completeness

Check that all required models exist:

```javascript
// Expected models from API
const REQUIRED_MODELS = [
  'User',
  'Collection',
  'Painting',
  'Exhibition',
  'DesignProject',
  'Illustration',
  'Biography',
];
```

**Verify:**
- [ ] All models exist in schema.prisma
- [ ] All required fields are present
- [ ] Field types are correct
- [ ] Default values are set
- [ ] @unique constraints are in place

### Phase 3: Relations

Check that all relations are defined:

**Verify:**
- [ ] `Collection.paintings` → `Painting[]` (one-to-many)
- [ ] `Painting.collection` → `Collection` (many-to-one)
- [ ] `onDelete` behavior is correct (Cascade where needed)
- [ ] No orphaned relations

### Phase 4: Migrations

```bash
# Check migration status
pnpm exec prisma migrate status

# Create new migration if needed
pnpm exec prisma migrate dev --name migration_name
```

**Verify:**
- [ ] All migrations are applied
- [ ] No pending migrations
- [ ] Migration history is clean

### Phase 5: Seed Data

```bash
# Validate seed script
node prisma/seed.js --validate

# Test seed
pnpm exec prisma db seed
```

**Verify:**
- [ ] Seed script is valid JavaScript
- [ ] Seed data matches schema
- [ ] No duplicate data issues
- [ ] Required relations are satisfied

### Phase 6: Query Validation

Check that controllers use Prisma correctly:

```bash
# Find raw SQL queries (should not exist)
grep -r "queryRaw\|executeRaw" src/ --include="*.js"

# Find Prisma client usage
grep -r "prisma\." src/ --include="*.js" | head -20
```

**Verify:**
- [ ] No raw SQL queries
- [ ] All queries use Prisma Client
- [ ] Proper error handling on queries
- [ ] No N+1 query problems

### Phase 7: Generate Report

```
🔍 Prisma Validation Report

Files checked:
- prisma/schema.prisma
- prisma/seed.js
- src/**/*.js

Status:
✅ Schema: Valid
✅ Migrations: All applied
✅ Seed: Ready
❌ Relations: Missing relation on Painting

Issues found:
1. Painting model missing @relation to Collection
2. Seed data has 5 orphaned records

Recommendations:
1. Run: pnpm exec prisma migrate dev --name fix-relations
2. Run: pnpm exec prisma db seed
```

## Rules

1. **NEVER** use raw SQL (always Prisma Client)
2. **NEVER** skip migration validation
3. **ALWAYS** test seed after schema changes
4. **ALWAYS** verify relations before deployment
5. **ALWAYS** use `pnpm exec prisma` commands shown in workflow

## Common Issues

| Issue | Solution |
|-------|----------|
| Missing @relation | Add relation field to model |
| Orphaned records | Delete or assign to valid parent |
| Migration conflict | `prisma migrate reset --force` |
| Seed fails | Check data types match schema |
| N+1 queries | Use `include` or `select` |

## Rules

1. **NEVER** use raw SQL (always Prisma Client)
2. **NEVER** skip migration validation
3. **ALWAYS** test seed after schema changes
4. **ALWAYS** verify relations before deployment

---
name: tdd-workflow
description: Autonomous TDD workflow for implementing user stories (HU01-HU21). Use this agent when starting a new HU. It will create tests first, implement code, verify coverage, and commit. Triggers on: "implementar HU", "empezar HU", "HU01", "HU02", etc.
---

# TDD Workflow Agent

Autonomous agent for implementing user stories following strict TDD.

## Input

- **HU number**: Which user story to implement (e.g., "HU01")
- **HU description**: Brief description of what needs to be done

## Workflow

### Phase 1: Preparation

1. Read the HU details from `docs/0003-HU-PORTFOLIO.md`
2. Check `AGENTS.md` for:
   - Mapeo HU → Test file path
   - Type of test (unit vs integration)
   - Dependencies on other HUs
3. Check `docs/0001-API-DESIGN.md` for:
   - Endpoints related to this HU
   - Request/response formats
   - Data models needed

### Phase 2: RED — Create Failing Test

1. Create test file at the correct path:
   ```
   tests/unit/hu-XX-feature.test.js        # For unit tests
   tests/integration/hu-XX-feature.test.js  # For integration tests
   ```

2. Write test skeleton with:
   - Prisma mock setup (using `vi.mock`)
   - `beforeEach` for cleaning state
   - Test cases for happy path and error cases
   - Proper naming: `describe('HUXX - Nombre', () => {...})`

3. Run test — verify it FAILS:
   ```bash
   pnpm test -- tests/unit/hu-XX-feature.test.js
   ```

4. If test passes, it's not testing the right thing. Fix the test.

### Phase 3: GREEN — Minimal Implementation

1. Create only what's needed to make the test pass:
   - `src/controllers/` — Business logic
   - `src/routes/` — Express routes
   - `src/middleware/` — Auth, validation, etc.
   - `src/services/` — External services (email, upload)

2. Follow patterns from `skills/express-handler/SKILL.md`:
   - Use envelope format `{ "data": {...} }`
   - Use error codes from `openapi.yaml`
   - Add try/catch in all handlers
   - Use logger instead of console.log

3. Run test — verify it PASSES:
   ```bash
   pnpm test -- tests/unit/hu-XX-feature.test.js
   ```

4. If other tests break, fix the minimum to restore green.

### Phase 4: REFACTOR — Improve on Green

1. Only refactor when ALL tests are passing
2. Improve:
   - Naming (functions, variables, files)
   - Extract functions
   - Remove duplication
   - Add comments if needed (but minimal)
3. Run tests after EACH refactor step
4. If tests break, stop refactoring

### Phase 5: Verify Coverage

1. Run coverage for the specific file:
   ```bash
   pnpm run test:coverage -- --collectCoverageFrom='src/controllers/xx.js'
   ```

2. Verify 100% coverage on:
   - Branches
   - Functions
   - Lines
   - Statements

3. If not 100%, add missing tests.

### Phase 6: Security Check (OWASP)

Before marking HU as complete, verify:

- [ ] **A01 - Access Control**: Admin routes use `authenticate` middleware
- [ ] **A02 - Misconfiguration**: No hardcoded secrets, `.env` not committed
- [ ] **A04 - Crypto**: Passwords hashed with bcrypt (12 rounds), JWT secrets ≥32 chars
- [ ] **A05 - Injection**: Input validated with Joi/Zod, Prisma for DB queries
- [ ] **A07 - Auth**: Rate limiting on login (10 req/min), password policy enforced
- [ ] **A10 - Errors**: Try/catch in all handlers, generic error messages to client

### Phase 7: Documentation Sync

1. Verify `docs/openapi.yaml` has the endpoints for this HU
2. Verify `docs/0001-API-DESIGN.md` has examples for this HU
3. If not, add them.

### Phase 8: Commit

1. Stage all files:
   ```bash
   git add .
   ```

2. Commit with conventional format:
   ```bash
   git commit -m "feat(hu-XX): implement [brief description]"
   ```

## Output

After completion, report:

```
✅ HUXX - [Name] COMPLETE

Files created/modified:
- tests/unit/hu-XX-feature.test.js
- src/controllers/xx.js
- src/routes/xx.js

Coverage: 100%
Security: PASSED
Commit: abc1234
```

## Error Handling

If any phase fails:

1. **RED phase fails (test passes)**: Test is wrong, fix it
2. **GREEN phase fails (test still fails)**: Implementation is incomplete, add more code
3. **Coverage < 100%**: Add missing test cases
4. **Security check fails**: Fix the vulnerability before proceeding

## Rules

1. **NEVER** skip RED phase
2. **NEVER** proceed to next HU without 100% coverage
3. **NEVER** commit with failing tests
4. **NEVER** use `console.log` in production code (use logger)
5. **NEVER** hardcode secrets or tokens

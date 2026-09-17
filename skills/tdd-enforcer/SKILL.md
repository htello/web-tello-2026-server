---
name: tdd-enforcer
description: Enforce strict TDD workflow (RED-GREEN-REFACTOR) for every user story. Use this skill whenever writing new code, implementing a feature, fixing a bug, or starting any HU. Must be used BEFORE writing any implementation code. Triggers on: "implementar HU", "empezar HU", "nueva feature", "arreglar bug", "agregar funcionalidad", "crear test", or any code writing task.
---

# TDD Enforcer

Enforces strict Test-Driven Development for the portfolio-art project.

## Workflow (Non-Negotiable)

Every piece of code MUST follow this cycle:

### 1. RED — Write a Failing Test

- Create or open the test file FIRST
- Write the simplest test that describes the behavior
- Run `pnpm test` — the test MUST fail
- If the test passes, it's not testing the right thing

### 2. GREEN — Minimal Implementation

- Write the MINIMUM code to make the test pass
- No extra features, no "while I'm here" additions
- Run `pnpm test` — all tests MUST pass
- If other tests break, fix the minimum to restore green

### 3. REFACTOR — Improve on Green

- Only refactor when ALL tests are passing
- Improve naming, extract functions, remove duplication
- Run `pnpm test` after EACH refactor step
- If tests break, stop refactoring

## Rules

1. **NEVER** write implementation code without a failing test first
2. **NEVER** skip to the next HU without 100% coverage on the current one
3. **ALWAYS** run `pnpm run test:coverage` before considering a HU complete
4. **ALWAYS** commit after each GREEN phase (not after RED)
5. **ALWAYS** use `describe('HUXX - Nombre', () => {...})` naming

## Test File Naming

```
tests/unit/hu-XX-feature-name.test.js        # Unit tests
tests/integration/hu-XX-feature-name.test.js  # Integration tests
```

## Coverage Thresholds

```javascript
// vitest.config.js
export default {
  coverage: {
    thresholds: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

## Verification Checklist

Before marking a HU as complete:

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage is 100% (`pnpm run test:coverage`)
- [ ] No `console.log` in production code
- [ ] No skipped tests (`test.skip`, `xit`, `xdescribe`)
- [ ] Each test is independent (no shared state)
- [ ] `beforeEach` cleans up any side effects

## Common Mistakes to Avoid

- Writing code first, then tests (backwards!)
- Writing multiple tests before any implementation
- Skipping the REFACTOR phase
- Leaving partial implementations between HUs
- Using `test.only` or `describe.only` in final code

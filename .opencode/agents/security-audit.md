---
name: security-audit
description: Audit code for OWASP Top 10:2025 compliance. Use this agent before each PR or when reviewing security. Triggers on: "revisar seguridad", "audit", "OWASP", "security check", "verificar seguridad".
---

# Security Audit Agent

Audits code for OWASP Top 10:2025 compliance.

## Input

- **Files to audit**: Routes, controllers, middleware, services
- **Scope**: Single file, directory, or entire project

## Audit Checklist

### A01 - Broken Access Control

```bash
# Check: Admin routes without authenticate middleware
grep -r "router\.\(post\|put\|delete\)" src/routes/ | grep -v "authenticate"
```

**Verify:**
- [ ] All `POST /api/v1/admin/*` routes use `authenticate` middleware
- [ ] All `PUT /api/v1/admin/*` routes use `authenticate` middleware
- [ ] All `DELETE /api/v1/admin/*` routes use `authenticate` middleware
- [ ] CORS is configured with explicit origins
- [ ] No IDOR vulnerabilities (users can't access other users' data)

### A02 - Security Misconfiguration

```bash
# Check: Hardcoded secrets
grep -r "JWT_SECRET\|password\|secret\|token" src/ --include="*.js" | grep -v "process.env\|req.body\|req.user"

# Check: x-powered-by enabled
grep -r "x-powered-by" src/ | grep -v "disable"
```

**Verify:**
- [ ] `helmet()` is used in app setup
- [ ] `app.disable('x-powered-by')` is called
- [ ] No hardcoded secrets in code
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` exists with placeholder values

### A03 - Supply Chain

```bash
# Check: Lockfile exists
ls -la pnpm-lock.yaml

# Check: Audit passes
pnpm audit
```

**Verify:**
- [ ] `pnpm-lock.yaml` is committed
- [ ] `pnpm audit` has no critical vulnerabilities
- [ ] `.npmrc` has `engine-strict=true`

### A04 - Cryptographic Failures

```bash
# Check: Weak passwords
grep -r "password" src/ --include="*.js" | grep -v "bcrypt\|hash\|compare"

# Check: JWT secret length
grep -r "JWT_SECRET" src/ --include="*.js"
```

**Verify:**
- [ ] Passwords hashed with `bcrypt` (12 rounds)
- [ ] JWT secret is ≥32 characters
- [ ] No passwords in logs
- [ ] No secrets in error responses

### A05 - Injection

```bash
# Check: Raw SQL queries
grep -r "query\|execute\|\$queryRaw" src/ --include="*.js"

# Check: Input validation
grep -r "req\.body\|req\.params\|req\.query" src/ --include="*.js" | grep -v "validate\|sanitize"
```

**Verify:**
- [ ] All DB queries use Prisma (no raw SQL)
- [ ] Input validated with Joi/Zod on POST/PUT routes
- [ ] XSS prevention (sanitize user input)
- [ ] File upload validates type and size

### A06 - Insecure Design

```bash
# Check: Least privilege
grep -r "isPublished\|role" src/ --include="*.js"
```

**Verify:**
- [ ] Admin operations require ADMIN role
- [ ] `isPublished` defaults to `false`
- [ ] Validation is server-side (not just client-side)

### A07 - Auth Failures

```bash
# Check: Rate limiting
grep -r "rateLimit\|rate-limit" src/ --include="*.js"

# Check: Password policy
grep -r "password" src/ --include="*.js" | grep -v "bcrypt"
```

**Verify:**
- [ ] Rate limiting on login (10 req/min)
- [ ] Rate limiting on contact (5 req/min)
- [ ] Password minimum 8 characters
- [ ] Account lockout after 5 failed attempts (if implemented)
- [ ] JWT expiration ≤ 24 hours

### A08 - Data Integrity

**Verify:**
- [ ] `pnpm install --frozen-lockfile` in CI/CD
- [ ] No `eval()` on untrusted input
- [ ] No `new Function()` on untrusted input

### A09 - Logging Failures

```bash
# Check: console.log with sensitive data
grep -r "console\.log" src/ --include="*.js" | grep -v "test\|spec"

# Check: logger usage
grep -r "logger\.\(info\|warn\|error\)" src/ --include="*.js"
```

**Verify:**
- [ ] No `console.log` in production code (use logger)
- [ ] Login attempts are logged
- [ ] Access denied events are logged
- [ ] No secrets in logs
- [ ] No passwords in logs
- [ ] No request bodies with sensitive data in logs

### A10 - Exception Handling

```bash
# Check: Try/catch in controllers
grep -r "async.*req.*res" src/controllers/ --include="*.js" | head -5
# Then verify each has try/catch
```

**Verify:**
- [ ] All async handlers have try/catch
- [ ] Error responses don't expose stack traces
- [ ] Generic error messages to client
- [ ] Detailed errors logged server-side only

## Audit Report

After scanning, generate report:

```
🔒 Security Audit Report

Files scanned: X
Issues found: X

❌ CRITICAL (must fix):
- [file:line] Description

⚠️ WARNING (should fix):
- [file:line] Description

✅ PASSED:
- A01: Access Control
- A02: Security Misconfiguration
- A03: Supply Chain
- A04: Cryptographic Failures
- A05: Injection
- A06: Insecure Design
- A07: Auth Failures
- A08: Data Integrity
- A09: Logging Failures
- A10: Exception Handling

Summary: X critical, X warnings, X passed
```

## Commands

```bash
# Scan single file
pnpm exec security-audit src/routes/collections.js

# Scan all routes
pnpm exec security-audit src/routes/

# Scan entire project
pnpm exec security-audit

# Quick audit (critical checks only)
pnpm exec security-audit --quick
```

## Rules

1. **NEVER** skip A01 (Access Control) check
2. **NEVER** approve code with hardcoded secrets
3. **NEVER** approve code with `console.log` in production
4. **ALWAYS** verify rate limiting on public endpoints
5. **ALWAYS** check error handling doesn't expose internals

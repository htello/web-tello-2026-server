# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0./),
y este proyecto adherido al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Setup inicial del proyecto backend
- Configuración de Node.js + Express (JavaScript puro)
- Integración con Prisma ORM para PostgreSQL
- Configuración de Jest con 100% cobertura obligatoria
- Docker Compose para PostgreSQL local
- Skills del proyecto: `tdd-enforcer`, `prisma-mock`, `express-handler`, `hu-scaffold`
- Documento de diseño de API (`docs/API-DESIGN.md`)
- Guion de Historias de Usuario (HU01-HU21)
- AGENTS.md con instrucciones para agentes
- Configuración de CI/CD con GitHub Actions
- Seguridad OWASP Top 10:2025 implementada

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- JWT authentication para rutas admin
- Rate limiting en endpoint de contacto (5 req/min)
- Rate limiting en login (10 req/min)
- helmet.js para headers de seguridad
- bcrypt con 12 rounds para hashing de contraseñas
- CORS configurable por variable de entorno
- Validación de input con Joi/Zod en todas las rutas POST/PUT

## [0.1.0] - 2026-09-16

### Added
- Estructura inicial del proyecto
- Configuración de dependencias principales
- Schema de Prisma con modelos: User, Collection, Painting, Exhibition, DesignProject, Illustration, Biography
- Docker Compose para PostgreSQL 16
- Documentación completa del proyecto

### Notes
- Versión inicial en desarrollo
- Ningún endpoint implementado todavía
- Historias de usuario definidas (HU01-HU21)
- Stack: Node.js + Express + Prisma + PostgreSQL + Jest

[Unreleased]: https://github.com/tu-usuario/web-tello-2026/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tu-usuario/web-tello-2026/releases/tag/v0.1.0

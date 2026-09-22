# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 2142 líneas).
> Leer ESTE índice y abrir solo el bloque necesario con `offset/limit` ahorra ~85% de tokens.

## Uso
1. Localiza la ruta abajo y su **nº de línea**.
2. Lee solo ese bloque: `read docs/openapi.yaml offset=<línea> limit=<siguiente_línea - línea>`.
3. Para un schema, igual: offset = línea del schema, limit ≈ 20-30.

## Secciones
- `info` L2 · `servers` L11 · `tags` L17 · `security` L41
- `components.securitySchemes` L45 · `components.schemas` L52
- `paths` L559

## Paths (ruta — métodos @línea)
| Ruta | Métodos (línea) |
|---|---|
| /admin/users/register | POST L561 |
| /auth/login | POST L601 |
| /auth/forgot-password | POST L626 |
| /auth/reset-password | POST L661 |
| /admin/users | GET L695 |
| /admin/users/{id} | GET L738 · PUT L775 · DELETE L818 |
| /admin/users/{id}/password | PUT L854 |
| /collections | GET L896 |
| /collections/{id} | GET L914 |
| /admin/collections | GET L942 · POST L969 |
| /admin/collections/{id} | PUT L1002 · DELETE L1045 |
| /admin/collections/reorder | PUT L1075 |
| /paintings | GET L1105 |
| /paintings/featured | GET L1123 |
| /paintings/{id} | GET L1141 |
| /admin/paintings | GET L1169 · POST L1196 |
| /admin/paintings/{id} | PUT L1229 · DELETE L1272 |
| /admin/paintings/reorder | PUT L1302 |
| /exhibitions | GET L1332 |
| /admin/exhibitions | GET L1350 · POST L1377 |
| /admin/exhibitions/{id} | PUT L1410 · DELETE L1453 |
| /admin/exhibitions/reorder | PUT L1483 |
| /design | GET L1513 |
| /design/featured | GET L1555 |
| /admin/design | GET L1573 · POST L1600 |
| /admin/design/{id} | PUT L1633 · DELETE L1676 |
| /admin/design/reorder | PUT L1706 |
| /illustrations | GET L1736 |
| /illustrations/featured | GET L1754 |
| /admin/illustrations | GET L1772 · POST L1799 |
| /admin/illustrations/{id} | PUT L1832 · DELETE L1875 |
| /admin/illustrations/reorder | PUT L1905 |
| /biography | GET L1935 |
| /admin/biography | POST L1951 · PUT L1982 |
| /contact | POST L2021 |
| /admin/upload | POST L2053 |
| /health | GET L2099 |
| /health/db | GET L2112 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · ForgotPasswordRequest L115 · ResetPasswordRequest L124 · AuthResponse L138 · User L149 · UserUpdateRequest L166 · PasswordResetRequest L178 · Collection L187 · CollectionDetail L206 · CollectionRequest L216 · ReorderRequest L233 · PaintingSummary L243 · PaintingDetail L262 · PaintingRequest L275 · PaintingUpdateRequest L302 · PaintingReorderRequest L326 · Exhibition L339 · ExhibitionRequest L358 · DesignProject L378 · DesignRequest L404 · Illustration L429 · IllustrationRequest L448 · Biography L465 · BiographyRequest L479 · ContactRequest L493 · ContactResponse L511 · UploadResponse L521 · HealthResponse L540 · MessageResponse L550

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

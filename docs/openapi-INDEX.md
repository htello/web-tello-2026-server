# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 2149 líneas).
> Leer ESTE índice y abrir solo el bloque necesario con `offset/limit` ahorra ~85% de tokens.

## Uso
1. Localiza la ruta abajo y su **nº de línea**.
2. Lee solo ese bloque: `read docs/openapi.yaml offset=<línea> limit=<siguiente_línea - línea>`.
3. Para un schema, igual: offset = línea del schema, limit ≈ 20-30.

## Secciones
- `info` L2 · `servers` L11 · `tags` L17 · `security` L41
- `components.securitySchemes` L45 · `components.schemas` L52
- `paths` L566

## Paths (ruta — métodos @línea)
| Ruta | Métodos (línea) |
|---|---|
| /admin/users/register | POST L568 |
| /auth/login | POST L608 |
| /auth/forgot-password | POST L633 |
| /auth/reset-password | POST L668 |
| /admin/users | GET L702 |
| /admin/users/{id} | GET L745 · PUT L782 · DELETE L825 |
| /admin/users/{id}/password | PUT L861 |
| /collections | GET L903 |
| /collections/{id} | GET L921 |
| /admin/collections | GET L949 · POST L976 |
| /admin/collections/{id} | PUT L1009 · DELETE L1052 |
| /admin/collections/reorder | PUT L1082 |
| /paintings | GET L1112 |
| /paintings/featured | GET L1130 |
| /paintings/{id} | GET L1148 |
| /admin/paintings | GET L1176 · POST L1203 |
| /admin/paintings/{id} | PUT L1236 · DELETE L1279 |
| /admin/paintings/reorder | PUT L1309 |
| /exhibitions | GET L1339 |
| /admin/exhibitions | GET L1357 · POST L1384 |
| /admin/exhibitions/{id} | PUT L1417 · DELETE L1460 |
| /admin/exhibitions/reorder | PUT L1490 |
| /design | GET L1520 |
| /design/featured | GET L1562 |
| /admin/design | GET L1580 · POST L1607 |
| /admin/design/{id} | PUT L1640 · DELETE L1683 |
| /admin/design/reorder | PUT L1713 |
| /illustrations | GET L1743 |
| /illustrations/featured | GET L1761 |
| /admin/illustrations | GET L1779 · POST L1806 |
| /admin/illustrations/{id} | PUT L1839 · DELETE L1882 |
| /admin/illustrations/reorder | PUT L1912 |
| /biography | GET L1942 |
| /admin/biography | POST L1958 · PUT L1989 |
| /contact | POST L2028 |
| /admin/upload | POST L2060 |
| /health | GET L2106 |
| /health/db | GET L2119 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · ForgotPasswordRequest L115 · ResetPasswordRequest L124 · AuthResponse L138 · User L149 · UserUpdateRequest L166 · PasswordResetRequest L178 · Collection L187 · CollectionDetail L206 · CollectionRequest L216 · ReorderRequest L233 · PaintingSummary L243 · PaintingDetail L262 · PaintingRequest L275 · PaintingUpdateRequest L302 · PaintingReorderRequest L326 · Exhibition L336 · ExhibitionRequest L360 · DesignProject L385 · DesignRequest L411 · Illustration L436 · IllustrationRequest L455 · Biography L472 · BiographyRequest L486 · ContactRequest L500 · ContactResponse L518 · UploadResponse L528 · HealthResponse L547 · MessageResponse L557

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

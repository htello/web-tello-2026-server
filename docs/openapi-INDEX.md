# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 2139 líneas).
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
| /admin/paintings/{id} | PUT L1226 · DELETE L1269 |
| /admin/paintings/reorder | PUT L1299 |
| /exhibitions | GET L1329 |
| /admin/exhibitions | GET L1347 · POST L1374 |
| /admin/exhibitions/{id} | PUT L1407 · DELETE L1450 |
| /admin/exhibitions/reorder | PUT L1480 |
| /design | GET L1510 |
| /design/featured | GET L1552 |
| /admin/design | GET L1570 · POST L1597 |
| /admin/design/{id} | PUT L1630 · DELETE L1673 |
| /admin/design/reorder | PUT L1703 |
| /illustrations | GET L1733 |
| /illustrations/featured | GET L1751 |
| /admin/illustrations | GET L1769 · POST L1796 |
| /admin/illustrations/{id} | PUT L1829 · DELETE L1872 |
| /admin/illustrations/reorder | PUT L1902 |
| /biography | GET L1932 |
| /admin/biography | POST L1948 · PUT L1979 |
| /contact | POST L2018 |
| /admin/upload | POST L2050 |
| /health | GET L2096 |
| /health/db | GET L2109 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · ForgotPasswordRequest L115 · ResetPasswordRequest L124 · AuthResponse L138 · User L149 · UserUpdateRequest L166 · PasswordResetRequest L178 · Collection L187 · CollectionDetail L206 · CollectionRequest L216 · ReorderRequest L233 · PaintingSummary L243 · PaintingDetail L262 · PaintingRequest L275 · PaintingUpdateRequest L302 · PaintingReorderRequest L326 · Exhibition L336 · ExhibitionRequest L355 · DesignProject L375 · DesignRequest L401 · Illustration L426 · IllustrationRequest L445 · Biography L462 · BiographyRequest L476 · ContactRequest L490 · ContactResponse L508 · UploadResponse L518 · HealthResponse L537 · MessageResponse L547

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

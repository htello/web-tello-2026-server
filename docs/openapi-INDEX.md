# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 2206 líneas).
> Leer ESTE índice y abrir solo el bloque necesario con `offset/limit` ahorra ~85% de tokens.

## Uso
1. Localiza la ruta abajo y su **nº de línea**.
2. Lee solo ese bloque: `read docs/openapi.yaml offset=<línea> limit=<siguiente_línea - línea>`.
3. Para un schema, igual: offset = línea del schema, limit ≈ 20-30.

## Secciones
- `info` L2 · `servers` L11 · `tags` L17 · `security` L41
- `components.securitySchemes` L45 · `components.schemas` L52
- `paths` L623

## Paths (ruta — métodos @línea)
| Ruta | Métodos (línea) |
|---|---|
| /admin/users/register | POST L625 |
| /auth/login | POST L665 |
| /auth/forgot-password | POST L690 |
| /auth/reset-password | POST L725 |
| /admin/users | GET L759 |
| /admin/users/{id} | GET L802 · PUT L839 · DELETE L882 |
| /admin/users/{id}/password | PUT L918 |
| /collections | GET L960 |
| /collections/{id} | GET L978 |
| /admin/collections | GET L1006 · POST L1033 |
| /admin/collections/{id} | PUT L1066 · DELETE L1109 |
| /admin/collections/reorder | PUT L1139 |
| /paintings | GET L1169 |
| /paintings/featured | GET L1187 |
| /paintings/{id} | GET L1205 |
| /admin/paintings | GET L1233 · POST L1260 |
| /admin/paintings/{id} | PUT L1293 · DELETE L1336 |
| /admin/paintings/reorder | PUT L1366 |
| /exhibitions | GET L1396 |
| /admin/exhibitions | GET L1414 · POST L1441 |
| /admin/exhibitions/{id} | PUT L1474 · DELETE L1517 |
| /admin/exhibitions/reorder | PUT L1547 |
| /design | GET L1577 |
| /design/featured | GET L1619 |
| /admin/design | GET L1637 · POST L1664 |
| /admin/design/{id} | PUT L1697 · DELETE L1740 |
| /admin/design/reorder | PUT L1770 |
| /illustrations | GET L1800 |
| /illustrations/featured | GET L1818 |
| /admin/illustrations | GET L1836 · POST L1863 |
| /admin/illustrations/{id} | PUT L1896 · DELETE L1939 |
| /admin/illustrations/reorder | PUT L1969 |
| /biography | GET L1999 |
| /admin/biography | POST L2015 · PUT L2046 |
| /contact | POST L2085 |
| /admin/upload | POST L2117 |
| /health | GET L2163 |
| /health/db | GET L2176 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · ForgotPasswordRequest L115 · ResetPasswordRequest L124 · AuthResponse L138 · User L149 · UserUpdateRequest L166 · PasswordResetRequest L178 · Collection L187 · CollectionDetail L206 · CollectionRequest L216 · ReorderRequest L233 · PaintingSummary L243 · PaintingDetail L262 · PaintingRequest L275 · PaintingUpdateRequest L302 · PaintingReorderRequest L326 · Exhibition L336 · ExhibitionImage L365 · ExhibitionImageInput L387 · ExhibitionRequest L407 · DesignProject L442 · DesignRequest L468 · Illustration L493 · IllustrationRequest L512 · Biography L529 · BiographyRequest L543 · ContactRequest L557 · ContactResponse L575 · UploadResponse L585 · HealthResponse L604 · MessageResponse L614

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

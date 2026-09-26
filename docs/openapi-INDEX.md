# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 2302 líneas).
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
| /admin/collections | GET L1006 · POST L1047 |
| /admin/collections/{id} | PUT L1080 · DELETE L1123 |
| /admin/collections/reorder | PUT L1153 |
| /paintings | GET L1183 |
| /paintings/featured | GET L1201 |
| /paintings/{id} | GET L1219 |
| /admin/paintings | GET L1247 · POST L1300 |
| /admin/paintings/{id} | PUT L1333 · DELETE L1376 |
| /admin/paintings/reorder | PUT L1406 |
| /exhibitions | GET L1436 |
| /admin/exhibitions | GET L1454 · POST L1495 |
| /admin/exhibitions/{id} | PUT L1528 · DELETE L1571 |
| /admin/exhibitions/reorder | PUT L1601 |
| /design | GET L1631 |
| /design/featured | GET L1673 |
| /admin/design | GET L1691 · POST L1744 |
| /admin/design/{id} | PUT L1777 · DELETE L1820 |
| /admin/design/reorder | PUT L1850 |
| /illustrations | GET L1880 |
| /illustrations/featured | GET L1898 |
| /admin/illustrations | GET L1916 · POST L1957 |
| /admin/illustrations/{id} | PUT L1990 · DELETE L2033 |
| /admin/illustrations/reorder | PUT L2063 |
| /biography | GET L2093 |
| /admin/biography | POST L2109 · PUT L2140 |
| /contact | POST L2179 |
| /admin/upload | POST L2211 |
| /health | GET L2258 |
| /health/db | GET L2271 |

## Schemas (nombre @línea)
BearerAuth L46 · ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · ForgotPasswordRequest L115 · ResetPasswordRequest L124 · AuthResponse L138 · User L149 · UserUpdateRequest L166 · PasswordResetRequest L178 · Collection L187 · CollectionDetail L206 · CollectionRequest L216 · ReorderRequest L233 · PaintingSummary L243 · PaintingDetail L262 · PaintingRequest L275 · PaintingUpdateRequest L302 · PaintingReorderRequest L326 · Exhibition L336 · ExhibitionImage L365 · ExhibitionImageInput L387 · ExhibitionRequest L407 · DesignProject L442 · DesignRequest L468 · Illustration L493 · IllustrationRequest L512 · Biography L529 · BiographyRequest L543 · ContactRequest L557 · ContactResponse L575 · UploadResponse L585 · HealthResponse L604 · MessageResponse L614

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

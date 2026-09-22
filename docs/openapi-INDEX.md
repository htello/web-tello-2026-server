# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 2050 líneas).
> Leer ESTE índice y abrir solo el bloque necesario con `offset/limit` ahorra ~85% de tokens.

## Uso
1. Localiza la ruta abajo y su **nº de línea**.
2. Lee solo ese bloque: `read docs/openapi.yaml offset=<línea> limit=<siguiente_línea - línea>`.
3. Para un schema, igual: offset = línea del schema, limit ≈ 20-30.

## Secciones
- `info` L2 · `servers` L11 · `tags` L17 · `security` L41
- `components.securitySchemes` L45 · `components.schemas` L52
- `paths` L536

## Paths (ruta — métodos @línea)
| Ruta | Métodos (línea) |
|---|---|
| /admin/users/register | POST L538 |
| /auth/login | POST L578 |
| /admin/users | GET L603 |
| /admin/users/{id} | GET L646 · PUT L683 · DELETE L726 |
| /admin/users/{id}/password | PUT L762 |
| /collections | GET L804 |
| /collections/{id} | GET L822 |
| /admin/collections | GET L850 · POST L877 |
| /admin/collections/{id} | PUT L910 · DELETE L953 |
| /admin/collections/reorder | PUT L983 |
| /paintings | GET L1013 |
| /paintings/featured | GET L1031 |
| /paintings/{id} | GET L1049 |
| /admin/paintings | GET L1077 · POST L1104 |
| /admin/paintings/{id} | PUT L1137 · DELETE L1180 |
| /admin/paintings/reorder | PUT L1210 |
| /exhibitions | GET L1240 |
| /admin/exhibitions | GET L1258 · POST L1285 |
| /admin/exhibitions/{id} | PUT L1318 · DELETE L1361 |
| /admin/exhibitions/reorder | PUT L1391 |
| /design | GET L1421 |
| /design/featured | GET L1463 |
| /admin/design | GET L1481 · POST L1508 |
| /admin/design/{id} | PUT L1541 · DELETE L1584 |
| /admin/design/reorder | PUT L1614 |
| /illustrations | GET L1644 |
| /illustrations/featured | GET L1662 |
| /admin/illustrations | GET L1680 · POST L1707 |
| /admin/illustrations/{id} | PUT L1740 · DELETE L1783 |
| /admin/illustrations/reorder | PUT L1813 |
| /biography | GET L1843 |
| /admin/biography | POST L1859 · PUT L1890 |
| /contact | POST L1929 |
| /admin/upload | POST L1961 |
| /health | GET L2007 |
| /health/db | GET L2020 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · AuthResponse L115 · User L126 · UserUpdateRequest L143 · PasswordResetRequest L155 · Collection L164 · CollectionDetail L183 · CollectionRequest L193 · ReorderRequest L210 · PaintingSummary L220 · PaintingDetail L239 · PaintingRequest L252 · PaintingUpdateRequest L279 · PaintingReorderRequest L303 · Exhibition L316 · ExhibitionRequest L335 · DesignProject L355 · DesignRequest L381 · Illustration L406 · IllustrationRequest L425 · Biography L442 · BiographyRequest L456 · ContactRequest L470 · ContactResponse L488 · UploadResponse L498 · HealthResponse L517 · MessageResponse L527

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

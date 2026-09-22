# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 1919 líneas).
> Leer ESTE índice y abrir solo el bloque necesario con `offset/limit` ahorra ~85% de tokens.

## Uso
1. Localiza la ruta abajo y su **nº de línea**.
2. Lee solo ese bloque: `read docs/openapi.yaml offset=<línea> limit=<siguiente_línea - línea>`.
3. Para un schema, igual: offset = línea del schema, limit ≈ 20-30.

## Secciones
- `info` L2 · `servers` L11 · `tags` L17 · `security` L41
- `components.securitySchemes` L45 · `components.schemas` L52
- `paths` L505

## Paths (ruta — métodos @línea)
| Ruta | Métodos (línea) |
|---|---|
| /admin/users/register | POST L507 |
| /auth/login | POST L547 |
| /admin/users | GET L572 |
| /admin/users/{id} | GET L615 · PUT L652 · DELETE L695 |
| /admin/users/{id}/password | PUT L731 |
| /collections | GET L773 |
| /collections/{id} | GET L791 |
| /admin/collections | GET L819 · POST L846 |
| /admin/collections/{id} | PUT L879 · DELETE L922 |
| /admin/collections/reorder | PUT L952 |
| /paintings | GET L982 |
| /paintings/featured | GET L1000 |
| /paintings/{id} | GET L1018 |
| /admin/paintings | GET L1046 · POST L1073 |
| /admin/paintings/{id} | PUT L1106 · DELETE L1149 |
| /admin/paintings/reorder | PUT L1179 |
| /exhibitions | GET L1209 |
| /admin/exhibitions | GET L1227 · POST L1254 |
| /admin/exhibitions/{id} | PUT L1287 · DELETE L1330 |
| /admin/exhibitions/reorder | PUT L1360 |
| /design | GET L1390 |
| /design/featured | GET L1425 |
| /admin/design | GET L1443 · POST L1470 |
| /admin/design/{id} | PUT L1503 · DELETE L1546 |
| /illustrations | GET L1576 |
| /illustrations/featured | GET L1594 |
| /admin/illustrations | GET L1612 · POST L1639 |
| /admin/illustrations/{id} | PUT L1672 · DELETE L1715 |
| /biography | GET L1745 |
| /admin/biography | POST L1761 · PUT L1792 |
| /contact | POST L1831 |
| /admin/upload | POST L1863 |
| /health | GET L1909 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · AuthResponse L115 · User L126 · UserUpdateRequest L143 · PasswordResetRequest L155 · Collection L164 · CollectionDetail L183 · CollectionRequest L193 · ReorderRequest L210 · PaintingSummary L220 · PaintingDetail L239 · PaintingRequest L252 · PaintingReorderRequest L276 · Exhibition L289 · ExhibitionRequest L308 · DesignProject L328 · DesignRequest L352 · Illustration L377 · IllustrationRequest L394 · Biography L411 · BiographyRequest L425 · ContactRequest L439 · ContactResponse L457 · UploadResponse L467 · HealthResponse L486 · MessageResponse L496

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

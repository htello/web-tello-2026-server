# Índice OpenAPI — Portfolio API

> Mapa ligero de `docs/openapi.yaml` (fuente de verdad, 1953 líneas).
> Leer ESTE índice y abrir solo el bloque necesario con `offset/limit` ahorra ~85% de tokens.

## Uso
1. Localiza la ruta abajo y su **nº de línea**.
2. Lee solo ese bloque: `read docs/openapi.yaml offset=<línea> limit=<siguiente_línea - línea>`.
3. Para un schema, igual: offset = línea del schema, limit ≈ 20-30.

## Secciones
- `info` L2 · `servers` L11 · `tags` L17 · `security` L41
- `components.securitySchemes` L45 · `components.schemas` L52
- `paths` L532

## Paths (ruta — métodos @línea)
| Ruta | Métodos (línea) |
|---|---|
| /admin/users/register | POST L534 |
| /auth/login | POST L574 |
| /admin/users | GET L599 |
| /admin/users/{id} | GET L642 · PUT L679 · DELETE L722 |
| /admin/users/{id}/password | PUT L758 |
| /collections | GET L800 |
| /collections/{id} | GET L818 |
| /admin/collections | GET L846 · POST L873 |
| /admin/collections/{id} | PUT L906 · DELETE L949 |
| /admin/collections/reorder | PUT L979 |
| /paintings | GET L1009 |
| /paintings/featured | GET L1027 |
| /paintings/{id} | GET L1045 |
| /admin/paintings | GET L1073 · POST L1100 |
| /admin/paintings/{id} | PUT L1133 · DELETE L1176 |
| /admin/paintings/reorder | PUT L1206 |
| /exhibitions | GET L1236 |
| /admin/exhibitions | GET L1254 · POST L1281 |
| /admin/exhibitions/{id} | PUT L1314 · DELETE L1357 |
| /admin/exhibitions/reorder | PUT L1387 |
| /design | GET L1417 |
| /design/featured | GET L1459 |
| /admin/design | GET L1477 · POST L1504 |
| /admin/design/{id} | PUT L1537 · DELETE L1580 |
| /illustrations | GET L1610 |
| /illustrations/featured | GET L1628 |
| /admin/illustrations | GET L1646 · POST L1673 |
| /admin/illustrations/{id} | PUT L1706 · DELETE L1749 |
| /biography | GET L1779 |
| /admin/biography | POST L1795 · PUT L1826 |
| /contact | POST L1865 |
| /admin/upload | POST L1897 |
| /health | GET L1943 |

## Schemas (nombre @línea)
ErrorResponse L53 · PaginationMeta L74 · RegisterRequest L86 · LoginRequest L103 · AuthResponse L115 · User L126 · UserUpdateRequest L143 · PasswordResetRequest L155 · Collection L164 · CollectionDetail L183 · CollectionRequest L193 · ReorderRequest L210 · PaintingSummary L220 · PaintingDetail L239 · PaintingRequest L252 · PaintingUpdateRequest L279 · PaintingReorderRequest L303 · Exhibition L316 · ExhibitionRequest L335 · DesignProject L355 · DesignRequest L379 · Illustration L404 · IllustrationRequest L421 · Biography L438 · BiographyRequest L452 · ContactRequest L466 · ContactResponse L484 · UploadResponse L494 · HealthResponse L513 · MessageResponse L523

## Regenerar este índice (si cambia openapi.yaml)
```bash
grep -nE '^  /[a-zA-Z]' docs/openapi.yaml                          # paths
grep -nE '^    (get|post|put|delete|patch):' docs/openapi.yaml     # métodos
grep -nE '^    [A-Z][A-Za-z]+:' docs/openapi.yaml                  # schemas
```

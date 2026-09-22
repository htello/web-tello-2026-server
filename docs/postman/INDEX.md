# Índice de endpoints — Portfolio API

> Mapa ligero de `portfolio-api.postman_collection.json` (52 requests).
> Leer ESTE archivo en vez del JSON completo ahorra ~90% de tokens.
> Fuente de verdad del contrato (schemas/respuestas/validación): `docs/openapi.yaml`.

## Variables de colección
- `baseUrl` = `http://localhost:3000/api/v1`
- `authToken` = (se rellena solo al hacer login)

## Cómo ver el detalle de UNA request sin leer el archivo entero
```bash
# Sustituye el nombre por el que quieras (ej. "POST /admin/collections")
jq '.. | objects | select(.name?=="POST /admin/collections")' \
  docs/postman/portfolio-api.postman_collection.json
```

## Endpoints (carpeta > nombre  [método url])

### Health
- GET /health  `{{baseUrl}}/health`
- GET /health/db  `{{baseUrl}}/health/db`

### Auth
- POST /auth/login  `{{baseUrl}}/auth/login`
- POST /auth/forgot-password  `{{baseUrl}}/auth/forgot-password`
- POST /auth/reset-password  `{{baseUrl}}/auth/reset-password`
- POST /admin/users/register  `{{baseUrl}}/admin/users/register`

### Users (Admin)
- GET /admin/users  `{{baseUrl}}/admin/users?page=1&limit=20`
- GET /admin/users/:id  `{{baseUrl}}/admin/users/1`
- PUT /admin/users/:id  `{{baseUrl}}/admin/users/1`
- DELETE /admin/users/:id  `{{baseUrl}}/admin/users/2`
- PUT /admin/users/:id/password  `{{baseUrl}}/admin/users/1/password`

### Collections
- Publicas > GET /collections  `{{baseUrl}}/collections`
- Publicas > GET /collections/:id  `{{baseUrl}}/collections/1`
- Admin > GET /admin/collections  `{{baseUrl}}/admin/collections`
- Admin > POST /admin/collections  `{{baseUrl}}/admin/collections`
- Admin > PUT /admin/collections/:id  `{{baseUrl}}/admin/collections/1`
- Admin > DELETE /admin/collections/:id  `{{baseUrl}}/admin/collections/3`
- Admin > PUT /admin/collections/reorder  `{{baseUrl}}/admin/collections/reorder`

### Paintings
- Publicas > GET /paintings  `{{baseUrl}}/paintings`
- Publicas > GET /paintings/featured  `{{baseUrl}}/paintings/featured`
- Publicas > GET /paintings/:id  `{{baseUrl}}/paintings/1`
- Admin > GET /admin/paintings  `{{baseUrl}}/admin/paintings`
- Admin > POST /admin/paintings  `{{baseUrl}}/admin/paintings`
- Admin > PUT /admin/paintings/:id  `{{baseUrl}}/admin/paintings/1`
- Admin > DELETE /admin/paintings/:id  `{{baseUrl}}/admin/paintings/5`
- Admin > PUT /admin/paintings/reorder  `{{baseUrl}}/admin/paintings/reorder`

### Exhibitions
- Publicas > GET /exhibitions  `{{baseUrl}}/exhibitions`
- Admin > GET /admin/exhibitions  `{{baseUrl}}/admin/exhibitions`
- Admin > POST /admin/exhibitions  `{{baseUrl}}/admin/exhibitions`
- Admin > PUT /admin/exhibitions/:id  `{{baseUrl}}/admin/exhibitions/1`
- Admin > DELETE /admin/exhibitions/:id  `{{baseUrl}}/admin/exhibitions/5`
- Admin > PUT /admin/exhibitions/reorder  `{{baseUrl}}/admin/exhibitions/reorder`

### Design
- Publicas > GET /design/featured  `{{baseUrl}}/design/featured`
- Publicas > GET /design (sin subcategoría → 400)  `{{baseUrl}}/design`
- Publicas > GET /design?subcategory=imagen-corporativa  `{{baseUrl}}/design?subcategory=imagen-corporativa`
- Publicas > GET /design?subcategory=packaging-expositores  `{{baseUrl}}/design?subcategory=packaging-expositores`
- Publicas > GET /design?subcategory=carteleria  `{{baseUrl}}/design?subcategory=carteleria`
- Publicas > GET /design?subcategory=editorial  `{{baseUrl}}/design?subcategory=editorial`
- Admin > GET /admin/design  `{{baseUrl}}/admin/design`
- Admin > POST /admin/design  `{{baseUrl}}/admin/design`
- Admin > PUT /admin/design/:id  `{{baseUrl}}/admin/design/1`
- Admin > DELETE /admin/design/:id  `{{baseUrl}}/admin/design/3`
- Admin > PUT /admin/design/reorder  `{{baseUrl}}/admin/design/reorder`

### Illustrations
- Publicas > GET /illustrations/featured  `{{baseUrl}}/illustrations/featured`
- Publicas > GET /illustrations  `{{baseUrl}}/illustrations`
- Admin > GET /admin/illustrations  `{{baseUrl}}/admin/illustrations`
- Admin > POST /admin/illustrations  `{{baseUrl}}/admin/illustrations`
- Admin > PUT /admin/illustrations/:id  `{{baseUrl}}/admin/illustrations/1`
- Admin > DELETE /admin/illustrations/:id  `{{baseUrl}}/admin/illustrations/5`
- Admin > PUT /admin/illustrations/reorder  `{{baseUrl}}/admin/illustrations/reorder`

### Biography
- Publica > GET /biography  `{{baseUrl}}/biography`
- Admin > POST /admin/biography  `{{baseUrl}}/admin/biography`
- Admin > PUT /admin/biography  `{{baseUrl}}/admin/biography`

### Contact
- POST /contact  `{{baseUrl}}/contact`

### Upload (Admin)
- POST /admin/upload - Pintura  `{{baseUrl}}/admin/upload`
- POST /admin/upload - Ilustración  `{{baseUrl}}/admin/upload`
- POST /admin/upload - Diseño  `{{baseUrl}}/admin/upload`

## Regenerar este índice (si cambia la colección)
```bash
jq -r '
  def walk($prefix):
    .item[]? |
    if .item then (.name as $n | walk("\($prefix)\($n) > "))
    else "\($prefix)\(.name)  [\(.request.method) \(.request.url.raw)]" end;
  walk("")' docs/postman/portfolio-api.postman_collection.json
```

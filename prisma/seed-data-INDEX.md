# INDEX — prisma/seed-data.js (1854 líneas)

Datos reales de seed generados desde Wikimedia Commons (URLs remotas, no se sube a Cloudinary).
NUNCA leer el archivo completo: usar `offset/limit` con la línea de inicio o `sed -n 'A,Bp'`.

## Exportaciones

| Constante | Líneas | Contenido |
|-----------|--------|-----------|
| `NEW_COLLECTIONS` | 7–723 | 6 colecciones con 66 paintings anidadas (11 c/u). Campos colección: `title`, `description`, `paintings[]`. Campos painting: `title`, `description`, `imageUrl`, `dimensions`, `technique`, `isFeatured`, `isPublished`, `position` |
| `COLLECTION_TOPUP` | 724–870 | Objeto `{ "Coleccion 1": [...], "Coleeccion 2": [...] }` — 7 paintings extra por clave (mismos campos que painting) |
| `NEW_ILLUSTRATIONS` | 871–1025 | 19 ilustraciones sueltas: `title`, `description`, `imageUrl`, `isFeatured`, `isPublished`, `position` |
| `NEW_DESIGNS` | 1026–1460 | 48 diseños con `subcategory` (carteleria, imagen corporativa, maquetación, expositores, packaging): `title`, `description`, `imageUrl`, `subcategory`, `isFeatured`, `isPublished`, `position` |
| `NEW_EXHIBITIONS` | 1461–1748 | 3 exposiciones con `images[]` anidado: `title`, `date`, `endDate`, `location`, `description`, `position`, `isPublished` |
| `EXHIBITION_TOPUP` | 1749–1781 | `{ "Exposicion 2": [...] }` — imágenes extra: `url`, `thumbnail`, `width`, `height`, `position` |
| `ENRICH` | 1782–1850 | Enriquece datos del seed antiguo (claves = títulos/ids existentes): `collections` (2: descripción+coverImage), `paintings` (6: técnica+dimensiones), `illustrations` (5: descripción), `designs` (13: descripción), `exhibitions` (2: descripción) |
| `BIOGRAPHY` | 1851–1854 | `{ content, imageUrl }` — biografía del artista |

## Comandos de consulta puntual

```bash
# Bloque concreto (ej. NEW_DESIGNS)
sed -n '1026,1460p' prisma/seed-data.js

# ¿Existe un título/clave? (sin leer el archivo)
grep -n '"Título buscado"' prisma/seed-data.js

# Subcategorías de designs
grep -o '"subcategory": "[^"]*"' prisma/seed-data.js | sort | uniq -c

# Títulos de colecciones
awk 'NR>=7 && NR<=723 && /^    "title"/' prisma/seed-data.js
```

## Regenerar este índice

```bash
grep -n "^export const" prisma/seed-data.js   # nueva tabla de líneas
grep -c '"title":' prisma/seed-data.js        # total de entradas
```

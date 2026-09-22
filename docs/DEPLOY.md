# Guía de Despliegue — Render (Docker) + Supabase

Arquitectura: API Express en **Render** (Web Service free, runtime Docker) + PostgreSQL en **Supabase** (free). El front (cuando exista) irá en otro hosting (p. ej. Vercel) y se declarará en `CORS_ORIGIN`.

## 1. Supabase (BD)

1. Crear proyecto en **Frankfurt (eu-central-1)** — misma región que el servicio de Render.
2. Copiar la connection string **Session pooler** (Settings → Database → Connection string):
   `postgresql://postgres.<ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   - Esa única URL sirve para la app y para `prisma migrate deploy` (el entrypoint la usa).
   - Si `migrate deploy` diera problemas vía pooler, usar temporalmente la **Direct connection** (`db.<ref>.supabase.co:5432`) solo para migrar.
3. Anotar también la password de BD (se incluye en la URL).

## 2. Render (API)

1. New → **Blueprint** → repo `htello/web-tello-2026-server` → rama **main**. Detecta `render.yaml` (servicio `portfolio-api`, Docker, free, healthcheck `/api/v1/health`).
2. Rellenar las variables marcadas `sync: false`:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Connection string de Supabase (paso 1) |
| `CLOUDINARY_URL` | `cloudinary://<key>:<secret>@<cloud>` |
| `CORS_ORIGIN` | Origen del front (mientras no exista: la URL de Render, p. ej. `https://portfolio-api.onrender.com`) |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP reales (pendiente; sin ellas `POST /contact` devuelve 502 `EMAIL_ERROR`) |
| `SENTRY_DSN` | Opcional |

   `JWT_SECRET` se genera solo (`generateValue: true`); `NODE_ENV`, `PORT` (Render la inyecta), `SMTP_PORT=587` y `LOG_LEVEL=info` van preconfiguradas.
3. Apply → primer deploy. El entrypoint ejecuta `prisma migrate deploy` antes de arrancar.
4. Verificar: `GET https://<servicio>.onrender.com/api/v1/health` y `/api/v1/health/db` → 200.

## 3. Admin de producción (una sola vez)

El registro por API exige un admin previo, así que el primer admin se crea con el script de bootstrap, **en local y contra la BD de prod** (las credenciales nunca pasan por el repo ni por el chat):

```bash
DATABASE_URL='<url-supabase>' \
ADMIN_EMAIL='tu@email.com' \
ADMIN_PASS='<contraseña fuerte: ≥8, mayúscula y símbolo>' \
ADMIN_NAME='Antonio Tello' \
node scripts/bootstrap-admin.js
```

Re-ejecutarlo con el mismo email actualiza la contraseña (upsert). **No ejecutar `prisma db seed` en producción** (crea `admin@test.com/Admin123!` y contenido demo).

## 4. Ping anti-pausa (free tiers)

- Crear job en [cron-job.org](https://cron-job.org) (o UptimeRobot): `GET https://<servicio>.onrender.com/api/v1/health/db` cada **10 min**.
- Mantiene despierto el web service de Render (spin-down a los 15 min) y activa la BD de Supabase (pausa a los ~7 días de inactividad).

## 5. Ciclo de despliegue

1. Trabajar en rama `fix/*` o `chore/*` desde `develop`.
2. Merge a `develop` (CI corre tests + cobertura 100%).
3. Publicar: merge `develop` → `main` + push → Render redeploya automáticamente.
4. Verificar health checks y humo básico en Postman con `baseUrl` de prod.

## Limitaciones free conocidas

- Render free: cold start ~30-60 s tras inactividad (mitigado por el ping), 512 MB RAM.
- Supabase free: 500 MB de BD; si se pausa igualmente, reanudar en su dashboard.
- Un solo `CORS_ORIGIN` (ver `src/app.js`); si el front necesita varios orígenes (preview + prod), añadir soporte multi-origen.

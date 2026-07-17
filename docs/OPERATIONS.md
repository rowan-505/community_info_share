# Operations

Runbook for environment, migrations, Docker, CI, and security notes.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `3000`) |
| `NODE_ENV` | `development` / `production` / `test` |
| `DATABASE_URL` | PostgreSQL connection to shared CoreMap/Supabase DB |
| `JWT_SECRET` | Required HS256 signing secret (must match CoreMap if sharing tokens) |
| `CORS_ORIGIN` | Optional comma-separated allowed origins; unset = allow all (dev) |
| `DEMO_MODE` | `true` enables `/demo/*` routes and frontend Demo toolbar |
| `RATE_LIMIT_*` | Per-route request limits (login, register, posts, reactions) |

Copy from [`backend/.env.example`](../backend/.env.example).

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:3000`) |

### Docker root (`.env` from [`.env.docker.example`](../.env.docker.example))

Same critical values: `DATABASE_URL`, `JWT_SECRET`, optional `DEMO_MODE`, `CORS_ORIGIN`.

## Database migrations and seed

```bash
cd backend
npm run db:migrate:deploy   # apply committed migrations
npm run db:seed             # sample posts only
```

Notes:

- Migrations manage the `community` schema and map shared `app_auth` models
- Shared `app_auth` tables must already exist; this project does not create CoreMap from scratch
- Seed attaches a few community posts to the first existing `auth_users` row
- Seed does **not** create users or known passwords

Useful scripts:

| Script | Action |
|--------|--------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Dev migrate (local iteration) |
| `npm run db:migrate:deploy` | Apply migrations (Docker / shared envs) |
| `npm run db:seed` | Seed sample posts |
| `npm run db:studio` | Prisma Studio |

## Local development

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Checks:

```bash
curl http://localhost:3000/health
# open http://localhost:3000/docs
# open http://localhost:5173
```

## Docker

Compose runs the **backend container only**, pointed at an existing shared database.

```bash
cp .env.docker.example .env
# Edit DATABASE_URL + JWT_SECRET (and DEMO_MODE if showcasing)
docker compose up --build
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npm run db:seed
```

Limitations:

- Frontend is not containerized — run it with Vite locally
- A fresh empty Postgres service is **not** provided, because migrations expect pre-existing `app_auth`
- Do not enable `DEMO_MODE` on a real production deploy

Validate config without starting containers:

```bash
docker compose config
```

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

On every push and pull request:

1. Install backend deps → `prisma generate` → `tsc` → `npm test`
2. Install frontend deps → `npm run build`

CI uses dummy `DATABASE_URL` / `JWT_SECRET` values. It does **not** connect to a real database, run migrations, start Docker, or deploy.

Current backend tests cover Demo Mode flag behavior and notification type helpers.

## Security notes for real deployments

- Set a long random `JWT_SECRET`
- Keep `DEMO_MODE=false`
- Prefer an explicit `CORS_ORIGIN` allow-list
- Never commit real `.env` files (examples only)
- Treat shared `app_auth` as production identity data — demo users and sessions land there when Demo Mode is on
- Rate limits are enabled on login, register, create-post, and reactions

## Production gaps (intentional MVP limits)

- No frontend Docker image
- No automated end-to-end / API integration suite against a live DB
- No deploy pipeline beyond build CI
- Existing access tokens may remain valid until expiry for some routes after status changes (refresh/login are blocked for disabled accounts)

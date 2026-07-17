# Community Info & News

Student MVP for a community information platform: neighbors share local updates, react to build trust, and admins review posts and moderate accounts.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript |
| Backend | Fastify, TypeScript, Zod |
| Database | PostgreSQL via Prisma (`community` + shared CoreMap `app_auth`) |
| Auth | JWT (HS256) + Argon2id (bcrypt legacy fallback) + refresh sessions |
| Docs / ops | Swagger UI, Docker (backend), GitHub Actions CI |

## Prerequisites

- Node.js 22+
- Access to an existing CoreMap / Supabase PostgreSQL database that already has the shared `app_auth` schema (`auth_users`, `auth_roles`, `auth_user_roles`, `auth_sessions`)
- This project **cannot** fully bootstrap against a fresh empty Postgres database

## Quick start (local)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL (shared DB) and JWT_SECRET
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- App: `http://localhost:5173`

### Accounts

The seed creates sample **posts** only. It does **not** create users or passwords.

- Register a new account via the Auth page (`user` role), or
- Enable Demo Mode for classroom showcase accounts (see [docs/DEMO.md](docs/DEMO.md))

Roles used by this app: `user`, `admin`, `super_admin`. There is no `validator` role.

## Demo Mode (showcase)

```bash
# in backend/.env
DEMO_MODE=true
```

Restart the backend. The frontend Demo toolbar appears when `/demo/status` reports enabled.

Full walkthrough: [docs/DEMO.md](docs/DEMO.md)

## Docker (backend only)

```bash
cp .env.docker.example .env
# Set DATABASE_URL to the shared CoreMap/Supabase database and JWT_SECRET
docker compose up --build
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npm run db:seed
```

Run the frontend locally as above. Details: [docs/OPERATIONS.md](docs/OPERATIONS.md)

## Tests and build

```bash
cd backend && npm test && npm run build
cd ../frontend && npm run lint && npm run build
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Current system design, auth, data model, routes |
| [docs/DEMO.md](docs/DEMO.md) | Classroom Demo Mode script |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Env vars, migrations, Docker, CI, security notes |
| Swagger `/docs` | Live API contract |

# Community Info & News Backend MVP

Minimal full-stack project for a community information and news platform.

## Structure

```
├── frontend/   # React + Vite + TypeScript
├── backend/    # Fastify + TypeScript + Prisma
└── docs/       # Project documentation
```

## Quick start (local)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: `http://localhost:5173`

### Seed users (password: `password123`)

- `demo@community.local` — user
- `admin@community.local` — admin
- `validator@community.local` — validator

## Docker (backend + database)

```bash
cp .env.docker.example .env
docker compose up --build
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npm run db:seed
```

Run frontend separately (see above).

## Documentation

- [docs/FINAL-PROJECT-OVERVIEW.md](./docs/FINAL-PROJECT-OVERVIEW.md) — full MVP guide
- [docs/SUMMARY.md](./docs/SUMMARY.md) — step-by-step history
- [docs/steps/](./docs/steps/) — STEP-01 to STEP-14 guides

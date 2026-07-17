> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-01: Project Setup

## What was created

A minimal full-stack MVP scaffold with separate frontend and backend apps:

```
community-info-news-backend-mvp/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Fastify + TypeScript
├── docs/
│   ├── steps/
│   └── SUMMARY.md
├── .gitignore
└── README.md
```

## Folder purpose

| Folder | Purpose |
|--------|---------|
| `frontend/` | Client app (React + Vite + TypeScript). Independent SPA. |
| `backend/src/config/` | Environment and app configuration. |
| `backend/src/db/` | Database client placeholder (future Prisma). |
| `backend/src/plugins/` | Fastify plugin registration. |
| `backend/src/modules/` | Feature modules following routes → service → repository → database. |
| `backend/src/shared/` | Shared types and utilities. |
| `backend/prisma/` | Prisma schema placeholder (future PostgreSQL / Supabase). |
| `docs/steps/` | Step-by-step implementation guides. |

## Frontend / backend separation

- Each app has its own `package.json`, dependencies, and dev server.
- Frontend runs on port `5173` (Vite default).
- Backend runs on port `3000` (configurable via `.env`).
- No shared code between apps at this stage.
- Communication will happen over HTTP API calls in future steps.

## Backend module pattern (future)

```
modules/<feature>/
├── <feature>.routes.ts      # HTTP routes
├── <feature>.service.ts     # Business logic
└── <feature>.repository.ts  # Data access
```

A minimal `health` module demonstrates this pattern without business logic.

## How to run

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Verify: `GET http://localhost:3000/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

## Future dependencies (not installed yet)

- Prisma ORM
- PostgreSQL / Supabase
- Zod
- JWT
- Swagger

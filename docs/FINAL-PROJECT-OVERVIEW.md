# Community Info & News — Final Project Overview

This document explains the full MVP in simple English. Use it to present the project in class.

## Project purpose

This is a **community information platform**. Neighbors can:

- share local news and updates (Free Board)
- react to posts (confirm, useful, fake, resolved)
- build trust through community reactions
- see trusted posts on the Reliable Board
- get notifications when post status changes

Admins and validators can review posts and change their status.

This is a **student assignment MVP**. It is not a production system.

---

## Architecture

The project has three main parts:

```
Browser (React)
    ↓ HTTP + JSON
Backend API (Fastify)
    ↓ Prisma
PostgreSQL database
```

### Request path (backend)

Every feature follows the same pattern:

```
Route  →  Service  →  Repository  →  Database
```

| Layer | Job |
|-------|-----|
| **Route** | HTTP endpoint, validation, auth checks |
| **Service** | Business rules (when needed) |
| **Repository** | Read and write data with Prisma |

**Example:** Create post

```
POST /community/posts
  → community-posts.routes.ts
  → community-posts.service.ts
  → community-posts.repository.ts
  → PostgreSQL
```

---

## Tech stack

| Part | Technology |
|------|------------|
| Frontend | React, Vite, TypeScript |
| Backend | Fastify, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Validation | Zod |
| API docs | Swagger UI at `/docs` |
| Containers | Docker Compose (backend + database) |
| CI | GitHub Actions |

---

## Folder structure

```
Community-Info-Backend/
├── frontend/                 # React app
│   └── src/
│       ├── api/              # HTTP clients (calls backend)
│       ├── views/            # Pages (Free Board, Admin, etc.)
│       ├── components/       # Reusable UI parts
│       └── types/            # TypeScript types
├── backend/                  # Fastify API
│   ├── prisma/               # Schema, migrations, seed
│   └── src/
│       ├── modules/          # Features (auth, posts, admin, etc.)
│       ├── plugins/          # JWT, Swagger, rate limit
│       ├── config/           # Environment settings
│       └── openapi/          # Swagger schemas
├── docs/
│   ├── FINAL-PROJECT-OVERVIEW.md   # This file
│   ├── SUMMARY.md                  # Step history
│   └── steps/                      # STEP-01 to STEP-14 guides
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Main models (database)

| Model | Purpose |
|-------|---------|
| **User** | Account with email, role, status |
| **CommunityPost** | Local news post with status and trust score |
| **PostReaction** | One reaction per user per post |
| **Notification** | Message when post status changes |

### User roles

| Role | Can do |
|------|--------|
| `user` | Create posts, react, read boards |
| `validator` | Review posts (admin review) |
| `admin` | Review posts + suspend/ban users |

### User status

| Status | Meaning |
|--------|---------|
| `active` | Normal use |
| `suspended` | Can log in but cannot create posts or react |
| `banned` | Cannot log in |

### Post status

| Status | Meaning | Where shown |
|--------|---------|-------------|
| `free_board` | New post | Free Board |
| `community_confirmed` | Trust score ≥ 8 | Reliable Board |
| `admin_verified` | Approved by admin | Reliable Board |
| `rejected` | Not trusted | Admin Review only |
| `resolved` | Issue finished | Admin Review only |
| `expired` | Out of date | Admin Review only |

---

## Main API routes

### Public

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/community/posts/free-board` | Free Board posts |
| GET | `/community/posts/reliable-board` | Reliable Board posts |
| GET | `/community/posts/:publicId` | Single post |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |

### Authenticated (JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/auth/me` | Current user |
| POST | `/community/posts` | Create post |
| POST | `/community/posts/:publicId/reactions` | Add or change reaction |
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:publicId/read` | Mark as read |

### Admin / validator

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/community/posts` | All posts for review |
| POST | `/admin/community/posts/:publicId/verify` | Mark admin verified |
| POST | `/admin/community/posts/:publicId/reject` | Reject post |
| POST | `/admin/community/posts/:publicId/resolve` | Mark resolved |
| POST | `/admin/community/posts/:publicId/expire` | Mark expired |

### Admin only

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/users/:publicId/suspend` | Suspend user |
| POST | `/admin/users/:publicId/ban` | Ban user |
| POST | `/admin/users/:publicId/unban` | Unban user |

---

## Data flow

### Read Free Board

```
FreeBoard.tsx
  → communityPostsApi.getFreeBoardPosts()
  → GET /community/posts/free-board
  → community-posts.repository (status = free_board)
  → JSON list of posts
```

### Create post

```
CreatePost.tsx
  → communityPostsApi.createPost()
  → POST /community/posts (JWT)
  → save post with status free_board, trustScore 0
```

### Add reaction

```
ReactionButtons.tsx
  → communityPostsApi.addReaction()
  → POST /community/posts/:id/reactions (JWT)
  → upsert reaction
  → recalculate trust score
  → maybe change status to community_confirmed
  → create notification
```

---

## User flow

1. **Register or log in** on the Auth page.
2. **Read posts** on Free Board (no login needed).
3. **React to a post** (login required).
4. **Create a post** (login required, active status).
5. If trust score reaches **8**, post moves to **community_confirmed** and appears on Reliable Board.
6. **Check notifications** when status changes.

---

## Admin flow

1. Log in as **admin** or **validator**.
2. Open **Admin Review** page.
3. See all posts with any status.
4. Choose action: verify, reject, resolve, or expire.
5. Post author gets a **notification**.

**Admin-only moderation** (suspend/ban) works through API only. There is no UI for it in this MVP.

---

## Trust score logic

File: `backend/src/modules/community-posts/community-posts.trust.ts`

| Reaction | Score change |
|----------|--------------|
| confirm | +2 |
| useful | +1 |
| fake | -3 |
| resolved | 0 |

**Rules:**

- Each user can have **one reaction** per post (upsert).
- Trust score = sum of all reaction scores on the post.
- If status is `free_board` and score ≥ **8**, status becomes `community_confirmed`.
- Auto-promotion does **not** happen for `rejected`, `resolved`, or `expired` posts.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 3000) |
| `NODE_ENV` | development / production |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (required) |
| `RATE_LIMIT_*` | Rate limit settings |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend URL (default `http://localhost:3000`) |

### Docker (root `.env` from `.env.docker.example`)

PostgreSQL credentials and `JWT_SECRET` for Docker Compose.

---

## How to run

### Option A — Local (recommended for development)

**1. Start PostgreSQL** (local install or Docker db only).

**2. Backend:**

```bash
cd backend
npm install
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

**3. Frontend:**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open: `http://localhost:5173`

### Option B — Docker (backend + database)

```bash
cp .env.docker.example .env
docker compose up --build
docker compose exec backend npm run db:migrate:deploy
docker compose exec backend npm run db:seed
```

Then run frontend locally (see Option A step 3).

### Seed users (password: `password123`)

| Email | Role |
|-------|------|
| `demo@community.local` | user |
| `admin@community.local` | admin |
| `validator@community.local` | validator |

---

## How to test

### Quick checks

```bash
curl http://localhost:3000/health
```

Open Swagger: `http://localhost:3000/docs`

### Manual UI test

1. Open Free Board — see posts.
2. Log in as demo user — react and create a post.
3. Log in as admin — verify a post in Admin Review.
4. Check Notifications as demo user.

### CI (GitHub Actions)

On every push and pull request, CI runs:

- backend install, Prisma generate, TypeScript build
- frontend install and build

See `docs/steps/STEP-14-github-actions.md`.

---

## Future improvements

These are **not** in the MVP but are good next steps:

- Automated tests (unit + API)
- Admin UI for user moderation
- Production deployment (hosting + secrets)
- Map view with location pins
- Image uploads for posts
- Email notifications
- Pagination for large post lists

---

## How this can merge into CoreMap

**CoreMap** is a map-based platform. This community project can become one module inside it:

| This MVP | In CoreMap |
|----------|------------|
| Community posts | Map pins or info layers |
| Free Board | Unverified local reports on the map |
| Reliable Board | Verified community data layers |
| Trust score | Data quality score for map features |
| Admin review | Moderation workflow for map content |
| Notifications | Alerts for nearby map updates |
| JWT auth | Shared login across map and community |
| PostgreSQL + Prisma | Same database, new location fields |

**Merge steps (simple plan):**

1. Add `latitude` and `longitude` to `CommunityPost`.
2. Show posts as pins on the CoreMap frontend.
3. Reuse the same backend API (or merge into CoreMap API).
4. Use one auth system for both apps.
5. Keep trust score and admin review as the quality layer for map data.

---

## Files to study (by topic)

| Topic | Files to read |
|-------|---------------|
| App entry | `backend/src/server.ts`, `backend/src/app.ts`, `frontend/src/App.tsx` |
| Auth | `backend/src/plugins/auth.ts`, `backend/src/modules/auth/` |
| Posts + trust | `backend/src/modules/community-posts/` |
| Admin review | `backend/src/modules/admin-review/` |
| Notifications | `backend/src/modules/notifications/` |
| Database | `backend/prisma/schema.prisma`, `backend/prisma/seed.ts` |
| Frontend API | `frontend/src/api/client.ts`, `frontend/src/api/*.ts` |
| Docker | `docker-compose.yml`, `backend/Dockerfile` |
| CI | `.github/workflows/ci.yml` |

For step-by-step history, read [SUMMARY.md](./SUMMARY.md) and [steps/](./steps/).

> **Learning note:** This document explains the repository as it exists now. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-13: Docker Setup

## Current status

The repository contains:

- `backend/Dockerfile` — builds and runs the Fastify backend.
- `backend/.dockerignore` — excludes local dependencies, build output, Git files, and secrets from the image build context.
- `docker-compose.yml` — an older local stack containing the backend plus PostgreSQL 16.
- `.env.docker.example` — sample variables for that Compose stack.

The React frontend is **not containerized**.

## Important architecture change

The current application no longer owns a local user table. It uses CoreMap's shared Supabase authentication tables:

```text
app_auth.auth_users
app_auth.auth_roles
app_auth.auth_user_roles
app_auth.auth_sessions
```

Community tables remain in the separate `community` schema.

Because of this, the PostgreSQL service in the current `docker-compose.yml` is not a complete replacement for Supabase. A fresh local PostgreSQL container does not contain CoreMap's `app_auth` tables, so the auth-clone migration cannot create a fully working application by itself.

For the current project, the recommended Docker workflow is:

```text
Dockerized backend → existing shared Supabase/PostgreSQL database
Local Vite frontend → Dockerized backend
```

Do not run migrations or seeds against a database until you have confirmed which `DATABASE_URL` is active.

## Core Docker concepts

| Term | Meaning in this project |
|------|-------------------------|
| Image | Packaged backend application produced from `backend/Dockerfile` |
| Container | A running instance of the backend image |
| Build context | Files under `backend/` sent to Docker during `docker build` |
| Port mapping | Host port `3000` forwarded to container port `3000` |
| Environment variable | Runtime configuration such as `DATABASE_URL`, `JWT_SECRET`, and `DEMO_MODE` |
| Volume | Persistent Docker-managed storage; only the older local PostgreSQL Compose service uses one |

## How `backend/Dockerfile` works

The current Dockerfile performs these steps:

1. Starts from `node:22-slim`.
2. Sets `/app` as the working directory.
3. Installs OpenSSL, required by Prisma on this image.
4. Copies `package.json` and `package-lock.json`.
5. Runs `npm ci` for a reproducible dependency install.
6. Copies `prisma/` and runs `prisma generate`.
7. Copies the remaining backend source.
8. Runs `npm run build`, which generates Prisma Client again and compiles TypeScript into `dist/`.
9. Documents port `3000`.
10. Starts `node dist/server.js` through `npm start`.

This is a valid MVP image, but it is not optimized:

- It is a single runtime image rather than a small multi-stage production image.
- Development dependencies remain in the final image.
- Prisma Client is generated twice.
- Database migrations are not run automatically when the container starts.

Not running migrations automatically is intentional and safer for a shared database.

## Recommended: run the backend container with shared Supabase

### 1. Prerequisites

Install:

- Docker Desktop
- Node.js 22 and npm (for the local frontend)

Confirm Docker:

```bash
docker --version
docker compose version
```

### 2. Prepare backend environment variables

Use `backend/.env` for local classroom development:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...shared-supabase-connection...
JWT_SECRET=...same-secret-used-by-coremap...
DEMO_MODE=true
```

For production, use:

```env
NODE_ENV=production
DEMO_MODE=false
```

Never commit the real `.env` file.

### 3. Build the backend image

From the project root:

```bash
docker build -t community-info-backend:local ./backend
```

### 4. Check pending migrations

Run migrations as a separate one-off container:

```bash
docker run --rm \
  --env-file backend/.env \
  community-info-backend:local \
  npm run db:migrate:deploy
```

`db:migrate:deploy` applies committed migrations only. It does not create a development migration and does not reset the database.

### 5. Start the backend

```bash
docker run --rm \
  --name community-info-backend \
  --env-file backend/.env \
  -p 3000:3000 \
  community-info-backend:local
```

The server binds to `0.0.0.0`, so the host can reach it through the mapped port.

Run it in the background instead:

```bash
docker run -d \
  --name community-info-backend \
  --env-file backend/.env \
  -p 3000:3000 \
  community-info-backend:local
```

### 6. Verify the backend

```bash
curl http://localhost:3000/health
```

Open:

- Swagger: `http://localhost:3000/docs`
- Demo status: `http://localhost:3000/demo/status` when Demo Mode is enabled

Inspect logs:

```bash
docker logs -f community-info-backend
```

Stop and remove:

```bash
docker stop community-info-backend
docker rm community-info-backend
```

`docker rm` is unnecessary when the container was started with `--rm`.

## Start the frontend

The frontend remains a local Vite process:

```bash
cd frontend
npm ci
npm run dev
```

`frontend/.env` should contain:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## About the existing `docker-compose.yml`

Running:

```bash
docker compose up --build
```

currently creates:

```text
backend container → db:5432 → fresh PostgreSQL 16 container
```

It also stores PostgreSQL data in the `postgres_data` Docker volume.

This historical stack is useful only if you separately provision a compatible local copy of the shared `app_auth` schema. Without that schema, it does not represent the current CoreMap-integrated architecture.

Therefore, do not use the Compose database for the current class demo unless you intentionally create a safe local auth fixture first. Use the shared-Supabase container commands above instead.

Also note:

```bash
docker compose down -v
```

deletes the local Docker PostgreSQL volume. It does not affect Supabase, but it permanently removes all data in that local volume.

## Docker is not deployment

Building and running an image locally proves that the backend can be packaged. It does not publish the image or deploy it to a public server.

A real deployment still needs:

1. A container registry or a platform that builds from the Dockerfile.
2. A runtime service with port and health-check configuration.
3. Production environment variables and secrets.
4. A deliberate migration step.
5. A separately deployed frontend.
6. CORS configuration that permits the deployed frontend origin.

The repository currently provides no production deployment workflow.

## Common problems

### `app_auth` table does not exist

The backend is pointed at the fresh Docker PostgreSQL database instead of the shared CoreMap/Supabase database.

### Backend cannot connect to Supabase

Check `DATABASE_URL`, network access, pooler host/port, SSL requirements, and credentials.

### Port 3000 is already in use

Stop the existing backend or use a different host port:

```bash
docker run --rm --env-file backend/.env -p 3001:3000 community-info-backend:local
```

Then set `VITE_API_BASE_URL=http://localhost:3001`.

### Code changes do not appear

The image contains a build-time copy of the source. Rebuild it:

```bash
docker build -t community-info-backend:local ./backend
```

## Not included

- Frontend Docker image
- Production deployment
- Container registry publishing
- NGINX or another reverse proxy
- Kubernetes
- Redis, queues, or background workers

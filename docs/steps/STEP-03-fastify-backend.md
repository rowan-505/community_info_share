> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-03: Fastify Backend

## What was created

A minimal Fastify backend with a single health endpoint and basic error handling. No database, auth, or business logic.

## Structure

```
backend/src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── modules/
│   └── health/
│       └── health.routes.ts
└── shared/
    └── errors/
        └── error-handler.ts
```

## Request flow

```
HTTP request
  → server.ts (running process)
  → app.ts (Fastify instance)
  → health.routes.ts (route handler)
  → JSON response
```

If a route is missing or an error is thrown, `shared/errors/error-handler.ts` returns a structured error response.

## File purpose

| File | Purpose |
|------|---------|
| `server.ts` | Entry point. Loads env, builds the app, starts listening on a port. |
| `app.ts` | Creates and configures the Fastify instance, registers routes and error handlers. |
| `config/env.ts` | Reads `PORT` and `NODE_ENV` from environment variables. Defaults: port `3000`, env `development`. |
| `modules/health/health.routes.ts` | Defines `GET /health` and returns `{ "status": "ok" }`. |
| `shared/errors/error-handler.ts` | Handles uncaught errors and 404 responses. |

## How to run

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## How to test GET /health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

Test 404 handling:

```bash
curl http://localhost:3000/unknown
```

Expected response:

```json
{ "error": "Not Found", "message": "Route not found" }
```

## Not included yet

- Database (Prisma / PostgreSQL)
- Authentication (JWT)
- Community business endpoints
- Service / repository layers (not needed for health check)

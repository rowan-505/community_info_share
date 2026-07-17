> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-12: Swagger / OpenAPI Documentation

## What is Swagger?

Swagger (OpenAPI) is an interactive API reference. It lists all endpoints, request/response shapes, authentication requirements, and common errors — so developers can explore and test the API without reading source code.

This project uses `@fastify/swagger` for the OpenAPI spec and `@fastify/swagger-ui` for the browser UI.

## How to access /docs

Start the backend:

```bash
cd backend
npm run dev
```

Open in a browser:

```
http://localhost:3000/docs
```

The raw OpenAPI JSON spec is also available at:

```
http://localhost:3000/docs/json
```

## Documented modules

| Tag | Endpoints |
|-----|-----------|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Community Posts | Free board, reliable board, get by ID, create post |
| Reactions | `POST /community/posts/:publicId/reactions` |
| Admin Review | List posts, verify, reject, resolve, expire |
| Notifications | List, mark as read |
| Moderation | Suspend, ban, unban users |

Each endpoint includes:
- Request body schemas (where applicable)
- Path parameters
- Response schemas with examples
- Common errors (400, 401, 403, 404, 409, 429, 500)
- JWT bearer auth on protected routes

## How to test authenticated endpoints

1. Open `http://localhost:3000/docs`
2. Call `POST /auth/login` with seed credentials (e.g. `admin@community.local` / `password123`)
3. Copy the `token` from the response
4. Click **Authorize** at the top of Swagger UI
5. Enter: `Bearer <your-token>`
6. Try protected endpoints (create post, reactions, admin, notifications)

## Implementation notes

- Schemas live in `backend/src/openapi/schemas.ts`
- Swagger plugin: `backend/src/plugins/swagger.ts`
- Route schemas are attached to existing routes — no API redesign
- Business logic unchanged; Zod validation still runs as before

## Not included

- Auto-generated client SDKs
- API versioning
- External hosted docs portal

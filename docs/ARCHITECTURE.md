# Architecture

Current-state guide for explaining and presenting this MVP.

## High-level flow

```text
Browser (React + Vite)
        │  HTTP + JSON + Bearer JWT
        ▼
Fastify API
  Route → Service → Repository → Prisma
        │
        ▼
PostgreSQL
  community.*     (posts, reactions, notifications)
  app_auth.*      (shared CoreMap users, roles, sessions)
```

Every feature follows the same backend layering:

| Layer | Job |
|-------|-----|
| Route | HTTP, Zod/OpenAPI validation, auth gates |
| Service | Business rules when needed |
| Repository | Prisma reads/writes |

## Folder map

```text
frontend/src/
  api/          HTTP clients
  views/        Pages (boards, auth, admin, notifications)
  components/   Shared UI (including Demo toolbar)
  auth/         Token storage

backend/
  prisma/       Schema, migrations, seed
  src/
    modules/    Feature packages (auth, posts, admin, demo, …)
    plugins/    JWT, Prisma, rate limit, Swagger
    config/     Env + Demo Mode flags
    openapi/    Shared Swagger schemas
```

## Database schemas

### `community` (owned by this project)

| Table / enum | Purpose |
|--------------|---------|
| `community_posts` | Local news posts, status, trust score |
| `post_reactions` | One reaction per user per post |
| `notifications` | Status-change and reaction alerts |
| `post_status` | `free_board`, `community_confirmed`, `admin_verified`, `rejected`, `resolved`, `expired` |
| `reaction_type` | `confirm`, `useful`, `fake`, `resolved` |
| `notification_type` | Status + reaction notification kinds |

### `app_auth` (shared CoreMap — must already exist)

| Table | Purpose |
|-------|---------|
| `auth_users` | Accounts, password hashes, `account_status`, `is_active` |
| `auth_roles` | Role catalog (`user`, `admin`, `super_admin`, …) |
| `auth_user_roles` | User ↔ role assignments |
| `auth_sessions` | Refresh-token sessions (hashed) |

Community posts, reactions, and notifications reference `app_auth.auth_users.id`. There is **no** separate `community.users` table.

## Roles and authorization

| Role | Can do |
|------|--------|
| `user` | Register, login, create posts, react, read boards/notifications |
| `admin` | Everything a user can, plus post review and user moderation |
| `super_admin` | Same community admin powers as `admin` |

Public registration always creates the `user` role. Staff accounts are provisioned out-of-band in shared auth.

There is **no** `validator` role in this application.

## Authentication

- Passwords: new hashes use **Argon2id**; legacy **bcrypt** hashes verify and upgrade on login
- Access token: JWT HS256, claims `{ sub, email, roles }`, ~15 minutes
- Refresh token: opaque value, SHA-256 hash stored in `auth_sessions`, ~30 days, rotated on refresh
- `POST /auth/register` returns a profile only (no token) — client must login next
- `POST /auth/login` and `POST /auth/refresh` return access + refresh tokens
- Frontend stores tokens in `localStorage` and retries once after a 401 via refresh

### Account status (moderation mapping)

The shared DB allows only `active` | `disabled` | `deleted` on `account_status`.

| Admin action | Stored state | Effect |
|--------------|--------------|--------|
| Suspend | `disabled` + `is_active=true` | Cannot login / refresh / use protected writes |
| Ban | `disabled` + `is_active=false` + sessions revoked | Same block; sessions cleared |
| Unban | `active` + `is_active=true` | Restored |

Admins cannot moderate themselves or another admin/super_admin.

Background on this mapping (the `auth_users_account_status_chk` constraint
fix): [steps/STEP-user-moderation-fix.md](./steps/STEP-user-moderation-fix.md).

## Trust score and boards

Reaction weights (`community-posts.trust.ts`):

| Reaction | Score |
|----------|-------|
| confirm | +2 |
| useful | +1 |
| fake | −3 |
| resolved | 0 |

Rules:

- One reaction per user per post (upsert)
- Trust score = sum of reaction scores
- From `free_board`, if score ≥ **8** → status becomes `community_confirmed`
- Rejected / resolved / expired posts are not auto-promoted

Boards:

| Board | Statuses shown |
|-------|----------------|
| Free Board | `free_board`, `community_confirmed`, `admin_verified` |
| Reliable Board | `community_confirmed`, `admin_verified` |

Demo Mode can use a relaxed threshold for demo-authored posts only — see [DEMO.md](./DEMO.md).

## Notifications

Authors receive in-app notifications when:

- Another user reacts to their post (`post_reaction`)
- Post status changes (community confirm, admin verify/unverify, reject, resolve, expire)

Self-reactions do not notify. Identical repeat reactions do not notify again.

## Route summary

Public:

- `GET /health`
- `GET /docs`
- `POST /auth/register` | `/auth/login` | `/auth/refresh` | `/auth/logout`
- `GET /community/posts/free-board` | `/reliable-board` | `/:publicId`

Authenticated:

- `GET /auth/me`
- `POST /community/posts`
- `POST /community/posts/:publicId/reactions`
- `GET /notifications`
- `PATCH /notifications/:publicId/read`

Admin / super_admin:

- `GET /admin/community/posts`
- `POST /admin/community/posts/:publicId/verify` | `unverify` | `reject` | `resolve` | `expire`
- `GET /admin/users`
- `POST /admin/users/:publicId/suspend` | `ban` | `unban`

Conditional (`DEMO_MODE=true`):

- `GET /demo/status`
- `POST /demo/login/user` | `/reactor` | `/admin`
- `POST /demo/create-post` | `/run-full` | `/reset`

Live schemas and examples: Swagger at `/docs`.

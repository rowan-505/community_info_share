# Project Summary

This file is the **step-by-step history** of the Community Info & News MVP.

For the full project explanation, see [FINAL-PROJECT-OVERVIEW.md](./FINAL-PROJECT-OVERVIEW.md).  
For a reading guide, see [README.md](./README.md).

---

## Final status

**Phase:** Assignment MVP complete  
**Integration:** Frontend → Fastify API (JWT) → PostgreSQL (Prisma)  
**DevOps:** Docker Compose + GitHub Actions CI

The project is ready for submission as a student MVP.

---

## Step history

| Step | Title | What was added | Key files |
|------|-------|----------------|-----------|
| STEP-01 | Project setup | Monorepo with frontend + backend | `README.md`, folder structure |
| STEP-02 | Simple UI | 4 views with mock React state | `frontend/src/views/`, `components/` |
| STEP-03 | Fastify backend | Health endpoint, module pattern | `backend/src/app.ts`, `modules/health/` |
| STEP-04 | Community API mock | In-memory posts API | `modules/community-posts/` |
| STEP-05 | Connect UI to API | Frontend calls backend | `frontend/src/api/communityPostsApi.ts` |
| STEP-06 | Database + Prisma | PostgreSQL models and migrations | `backend/prisma/` |
| STEP-07 | Authentication | JWT register/login, protected routes | `plugins/auth.ts`, `modules/auth/` |
| STEP-08 | Reactions + trust | Reactions, trust score, auto-confirm | `community-posts.trust.ts` |
| STEP-09 | Admin review | Validator/admin post actions | `modules/admin-review/` |
| STEP-10 | Notifications | Status change alerts | `modules/notifications/` |
| STEP-11 | Moderation + rate limit | User suspend/ban, API rate limits | `modules/admin-users/` |
| STEP-12 | Swagger | OpenAPI docs at `/docs` | `plugins/swagger.ts`, `openapi/schemas.ts` |
| STEP-13 | Docker | Backend + PostgreSQL containers | `docker-compose.yml`, `backend/Dockerfile` |
| STEP-14 | GitHub Actions CI | Build checks on push/PR | `.github/workflows/ci.yml` |
| **Final review** | Project cleanup + docs | Dead code removed, overview doc | `docs/FINAL-PROJECT-OVERVIEW.md` |
| STEP-06 (fix) | Prisma schema fix | Moved Community tables into a dedicated `community` schema on shared Supabase DB; fixed `public.CommunityPost does not exist` | `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260715120000_init_community_schema/`, `docs/steps/STEP-06-database-prisma-fix.md` |
| STEP-auth (clone) | CoreMap auth clone | Replaced the local `community.users` auth with the shared CoreMap `app_auth` tables (same users, hashes, roles, JWT contract, refresh sessions); added register/login/refresh/logout/me; repointed post/notification/reaction FKs to `app_auth.auth_users` | `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260715130000_auth_coremap_clone/`, `backend/src/modules/auth/`, `backend/src/plugins/auth.ts`, `backend/src/plugins/prisma.ts`, `frontend/src/api/`, `docs/steps/STEP-auth-coremap-clone.md` |
| STEP-demo-mode | Demo Mode (dev only) | Development/classroom Demo Mode: 3 fixed demo users in shared `app_auth`, demo login/create-post/run-full/reset routes, demo-only one-confirm auto-promotion, strictly-scoped reset, and a frontend Demo panel | `backend/src/config/demo.ts`, `backend/src/modules/demo/`, `backend/src/modules/auth/session.ts`, `backend/src/modules/community-posts/community-posts.trust.ts`, `backend/src/modules/community-posts/community-posts.repository.ts`, `backend/src/app.ts`, `frontend/src/api/demoApi.ts`, `frontend/src/components/DemoToolbar.tsx`, `docs/steps/STEP-demo-mode.md` |
| STEP-reaction-notifications | Reaction notifications | Post author is notified when another user reacts (who + reaction + post + time), reusing the existing `community.notifications` table (+ `actor_user_id`, `reaction_type`, `post_reaction` type); notify only on new/changed reaction, never on self-reaction | `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260715140000_reaction_notifications/`, `backend/src/modules/notifications/`, `backend/src/modules/community-posts/community-posts.repository.ts`, `backend/src/openapi/schemas.ts`, `frontend/src/api/notificationsApi.ts`, `frontend/src/views/Notifications.tsx`, `docs/steps/STEP-reaction-notifications.md` |

### Auth clone status

- CoreMap auth clone: **completed**.
- Database tables reused (not duplicated): `app_auth.auth_users`, `app_auth.auth_roles`, `app_auth.auth_user_roles`, `app_auth.auth_sessions`.
- Duplicate `community.users` table + `user_role`/`user_status` enums: **removed**; post/notification/reaction FKs now reference `app_auth.auth_users.id`.
- JWT: HS256, claims `{ sub, email, roles }`, 15m access token — compatible with CoreMap when `JWT_SECRET` matches.
- Passwords: Argon2id for new hashes, bcryptjs fallback for legacy `$2a/$2b/$2y` with transparent upgrade.
- Refresh tokens: opaque 32-byte base64url, SHA-256 hash stored in `auth_sessions`, 30-day TTL, rotation on refresh, idempotent logout.
- Files changed: auth module (`routes/service/repository/schema/types/password/refresh-token`), `plugins/auth.ts`, new `plugins/prisma.ts`, `openapi/schemas.ts`, `app.ts`, `config/env.ts`, `prisma/seed.ts`, `prisma/schema.prisma` + new migration; removed the `admin-users` module; frontend `types/auth.ts`, `auth/tokenStorage.ts`, `api/client.ts`, `api/authApi.ts`, `views/AuthView.tsx`, `App.tsx`, `components/NavHeader.tsx`, `views/AdminReview.tsx`.
- Next recommended step: provision an `admin` / `super_admin` account in `app_auth` and add automated auth API tests.

### Demo Mode status

- Demo Mode added: **development-only** (active only when `DEMO_MODE=true` AND `NODE_ENV !== "production"`; routes are not registered otherwise, and a per-request guard returns `403`). Does not reuse or resurrect `AUTH_BYPASS`.
- Demo users (idempotent, in shared `app_auth`): `demo.user@coremap.local` (user), `demo.reactor@coremap.local` (user), `demo.admin@coremap.local` (admin).
- Routes added: `GET /demo/status`, `POST /demo/login/user|reactor|admin`, `POST /demo/create-post`, `POST /demo/run-full`, `POST /demo/reset`. Demo login issues real backend-signed JWTs via the shared session builder.
- Frontend controls: a `Demo Mode` panel (`DemoToolbar`) with Use Demo User/Reactor/Admin, Create Demo Post, Run Full Demo, Reset Demo Data, plus the current demo account indicator. Shown only when `/demo/status` reports enabled.
- Demo threshold rule (demo-created posts only): `confirm_count >= 1 AND trust_score >= 2 AND fake_count = 0 -> community_confirmed`. Reaction weights unchanged.
- Production threshold preserved: **yes** — real posts still use `trust_score >= 8` on `free_board`; the demo rule applies only when Demo Mode is on and the author is a fixed demo email.
- Reset safety: deletes ONLY demo-created posts, their reactions, demo notifications, and demo sessions — all scoped to IDs collected from the 3 demo emails, in a transaction, with a guard that aborts on any non-demo-owned post. Never truncates/drops, never deletes users, never touches CoreMap data.
- Next recommended step: add automated API tests for the demo login and reset-scope safety.

### Reaction notifications status

- Reaction notifications completed: **yes**. When another user reacts, the post author gets an in-app `post_reaction` notification (actor display name + reaction + post title + time). Status-change notifications remain unchanged.
- Notification table/model: reuses existing `community.notifications` (`Notification`). Added additive nullable columns `actor_user_id` (FK -> `app_auth.auth_users`, SetNull) and `reaction_type`, plus enum value `post_reaction` on `community.notification_type`. No new/duplicate table.
- Rules: notify only when reactor is not the author AND the reaction is new or changed type; identical repeat = no notification; self-reaction = no notification. Created inside the reaction transaction after the reaction is saved.
- Routes used (reused, unchanged): `GET /notifications` (owner-only, newest first), `PATCH /notifications/:publicId/read` (owner-only). Privacy enforced in the repository.
- Migration: `backend/prisma/migrations/20260715140000_reaction_notifications/` — additive/idempotent; apply with `npm run db:migrate:deploy`. Never resets/drops.
- Files changed: `backend/prisma/schema.prisma` (+migration), `backend/src/modules/notifications/{types,repository}.ts`, `backend/src/modules/community-posts/community-posts.repository.ts`, `backend/src/openapi/schemas.ts`, `frontend/src/api/notificationsApi.ts`, `frontend/src/views/Notifications.tsx`.
- Next recommended step: add automated API tests for the notify-on-change vs no-op and cross-user privacy rules.

### User moderation status

- Suspend / ban / unban restored in Admin Review for both real and Demo Mode.
- Routes: `GET /admin/users`, `POST /admin/users/:publicId/suspend|ban|unban` (admin / super_admin only).
- Writes only `app_auth.auth_users.account_status` + `is_active` (shared CoreMap users; no second user table). Ban also revokes sessions.
- Rules: cannot moderate yourself; cannot moderate another admin/super_admin; suspended can login but cannot post/react; banned cannot login (including demo login).
- Frontend: Admin Review now has a User Moderation section above Post Review.
- Demo reset restores the three demo users to `active`.
- Files: `backend/src/modules/admin-users/`, `backend/src/shared/account-status.ts`, `backend/src/plugins/auth.ts`, `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/demo/`, `frontend/src/api/adminUsersApi.ts`, `frontend/src/views/AdminReview.tsx`, `docs/steps/STEP-11-moderation-rate-limit.md`.
- Next recommended step: add automated API tests for suspend/ban enforcement.

---

## Stack overview

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React, Vite, TypeScript | Runs locally; not in Docker |
| Backend | Fastify, TypeScript | Route → service → repository |
| Database | Prisma, PostgreSQL (Supabase) | Community models in `community`; shared auth in `app_auth` (CoreMap); migrations `20260715120000_init_community_schema`, `20260715130000_auth_coremap_clone` |
| Validation | Zod | Request body checks |
| Auth | Shared CoreMap `app_auth` (JWT HS256 + Argon2id/bcryptjs + refresh sessions) | Roles: user, admin, super_admin |
| Rate limiting | @fastify/rate-limit | Login, register, posts, reactions |
| API docs | Swagger UI | `GET /docs` |
| Containers | Docker Compose | Backend + PostgreSQL only |
| CI | GitHub Actions | TypeScript build checks |

---

## Features checklist

| Feature | Status |
|---------|--------|
| Free Board | Done |
| Reliable Board | Done |
| Create post (auth) | Done |
| Reactions + trust score | Done |
| Auto community_confirmed | Done |
| JWT authentication | Done |
| Role authorization | Done |
| Admin review | Done |
| Notifications | Done |
| Reaction notifications | Done |
| Demo Mode (dev only) | Done |
| User moderation (suspend/ban/unban) | Done (Admin Review UI + API; shared `app_auth.account_status`) |
| Rate limiting | Done |
| Swagger | Done |
| Docker | Done |
| GitHub Actions CI | Done |
| Automated tests | Not added (MVP scope) |
| Production deploy | Not added (MVP scope) |

---

## Known limitations (acceptable for MVP)

- No automated test suite
- Frontend not containerized
- Duplicate post mappers in two backend repositories (kept to avoid large refactor)
- Docker build verified; first `node:22-slim` pull can be slow on slow networks
- Auth reuses CoreMap's shared `app_auth.auth_users` (no separate user table); moderation updates `account_status` / `is_active` only
- Cross-API token acceptance requires the same `JWT_SECRET` (see STEP-auth clone)

---

## Possible next steps (after submission)

- Add unit and API tests
- Deploy to a cloud host
- Add map view (CoreMap integration)

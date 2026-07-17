> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-demo-mode: Development-only Demo Mode

## Purpose

Demo Mode lets a presenter run through every main backend feature in class
without manually creating and switching between many real accounts. It provides
three fixed demo users, one-click account switching (real JWTs), a sample demo
post, a relaxed one-confirm auto-promotion rule for demo posts only, the normal
admin/notification flows, and a strictly-scoped reset — all without touching any
real or CoreMap data.

Everything uses the real API flow: `route -> service -> repository -> Prisma ->
PostgreSQL`. Nothing is faked in the frontend.

## Environment guard

Demo Mode is active only when **both** are true:

```
DEMO_MODE === "true"
AND NODE_ENV !== "production"
```

This is enforced by `isDemoModeEnabled()` in
[backend/src/config/demo.ts](../../backend/src/config/demo.ts):

- The `/demo/*` routes are **registered only when Demo Mode is enabled**
  ([backend/src/app.ts](../../backend/src/app.ts)). In production they do not
  exist and return `404`.
- Each demo route also re-checks at request time (`demoGuard`) and returns `403`
  if Demo Mode is off — defense-in-depth.
- Demo Mode does **not** reuse `AUTH_BYPASS` and never bypasses authentication.
  The reaction and admin steps still require real JWTs and real role checks.

## Three demo users (shared `app_auth`)

Stored in the shared `app_auth.auth_users` table (never a separate table),
identified by exact fixed emails, created idempotently, roles assigned via
`app_auth.auth_user_roles` using existing `app_auth.auth_roles`:

| Email | Display name | Role |
|-------|--------------|------|
| `demo.user@coremap.local` | `[DEMO] User` | `user` |
| `demo.reactor@coremap.local` | `[DEMO] Reactor` | `user` |
| `demo.admin@coremap.local` | `[DEMO] Admin` | `admin` |

`ensureDemoUser()` reuses an existing account if the email already exists and
tops up a missing role assignment. It never creates duplicates.

## Demo login flow

```
POST /demo/login/user | /demo/login/reactor | /demo/login/admin
  -> ensure demo user exists (idempotent)
  -> load roles from app_auth
  -> issue a REAL session (same JWT contract, same JWT_SECRET, claims { sub, email, roles })
  -> return SessionResponse { accessToken, refreshToken, expiresIn, user }
```

The demo login reuses the same session builder as the real login
([backend/src/modules/auth/session.ts](../../backend/src/modules/auth/session.ts))
and `authService.issueSessionForUser`, so tokens are genuine backend-signed
JWTs and refresh works normally.

## Demo post

```
POST /demo/create-post
  -> author = Demo User
  -> created via the normal community-post service
  -> status = free_board, trust_score = 0
```

Sample content (`DEMO_SAMPLE_POST`):

- Title: `Heavy rain and flooding near local market`
- Topic: `safety`
- Description: `Community members reported temporary flooding near the market road.`

A post is recognized as demo-created purely by its **author email** — no extra
DB columns were added.

## One-confirm Reliable Board rule (demo only)

The production auto-confirm rule is **unchanged**:

```
trust_score >= 8  (on a free_board post)  -> community_confirmed
```

A separate demo-only rule applies **only** when Demo Mode is enabled AND the
post's author is one of the three demo emails
([community-posts.repository.ts](../../backend/src/modules/community-posts/community-posts.repository.ts)
`resolveStatusAfterReaction`):

```
confirm_count >= 1 AND trust_score >= 2 AND fake_count = 0  -> community_confirmed
```

Reaction weights are unchanged: `confirm=+2`, `useful=+1`, `fake=-3`,
`resolved=0`. So one Confirm from Demo Reactor gives `trust_score = 2` and
promotes the demo post. Real posts are never affected.

## Admin demo flow

Demo Admin has the real `admin` role, so the existing admin routes work with no
special-casing, using the normal `app.authenticate + app.requireRole("admin",
"super_admin")` pattern:

```
POST /admin/community/posts/:publicId/verify   -> admin_verified
POST /admin/community/posts/:publicId/reject    -> rejected
POST /admin/community/posts/:publicId/resolve   -> resolved
POST /admin/community/posts/:publicId/expire     -> expired
```

## Notification flow

Notifications use the normal system (created inside the same transaction as the
status change, addressed to the post author). They fire for the demo post on
every notifiable status change: `community_confirmed`, `admin_verified`,
`rejected`, `resolved`, `expired`.

## Reset safety (`POST /demo/reset`)

Deletes **only** demo-created data, in one transaction, scoped to IDs collected
from the three fixed demo users
([demo.repository.ts](../../backend/src/modules/demo/demo.repository.ts)
`resetDemoData`):

1. Resolve demo user IDs by exact fixed emails. If none exist, no-op.
2. Collect demo post IDs (`authorId IN demoUserIds`).
3. Safety guard: abort if any collected post is not demo-owned.
4. Delete reactions where `postId IN demoPostIds`.
5. Delete notifications where `relatedPostId IN demoPostIds OR userId IN demoUserIds`.
6. Delete demo posts (`id IN demoPostIds`).
7. Delete demo users' sessions (`userId IN demoUserIds`).
8. Commit.

Demo users themselves are **kept** so they stay reusable.

### Tables touched by reset

- `community.post_reactions` (only rows for demo posts)
- `community.notifications` (only rows for demo posts / demo users)
- `community.community_posts` (only demo-authored posts)
- `app_auth.auth_sessions` (only the 3 demo users' sessions)

### Tables NEVER touched

- `app_auth.auth_users` (no user is ever deleted, demo or real)
- `app_auth.auth_roles`, `app_auth.auth_user_roles`
- Any non-demo community post, reaction, or notification
- Any CoreMap schema/table: map, transport, routing, search, core, feedback,
  public, etc. (these have no Prisma models here and are never referenced)

Reset never uses `TRUNCATE`, `DROP TABLE`, `DROP SCHEMA`,
`DELETE FROM community.community_posts`, or `prisma migrate reset`. Every delete
is filtered by an `IN (collected demo IDs)` clause.

## Frontend demo panel

A `Demo Mode` panel ([DemoToolbar.tsx](../../frontend/src/components/DemoToolbar.tsx))
renders only when `GET /demo/status` reports `enabled: true`. Buttons:

- `Use Demo User` / `Use Demo Reactor` / `Use Demo Admin` — call the demo login
  route, store the real tokens, and refresh auth state (no fake frontend state).
- `Create Demo Post` — calls `/demo/create-post` and refreshes the boards.
- `Run Full Demo` — calls `/demo/run-full` (create post + one confirm; no admin
  verify) and refreshes the boards.
- `Reset Demo Data` — asks for confirmation, then calls `/demo/reset` and
  refreshes the boards.

It also shows `Current demo account: User | Reactor | Admin | none`.

## Environment variables

Backend `backend/.env`:

```
NODE_ENV=development
DEMO_MODE=true      # local/class demo only; never in production
JWT_SECRET=...      # same secret as CoreMap
DATABASE_URL=...
```

`backend/.env.example` ships `DEMO_MODE=false`.

## How to run the class demo

1. Set `DEMO_MODE=true` and `NODE_ENV=development` in `backend/.env`.
2. Start backend: `cd backend && npm run dev`.
3. Start frontend: `cd frontend && npm run dev`.
4. In the browser, the `Demo Mode` panel appears at the top.
5. Click **Use Demo User** -> **Create Demo Post**. The post shows in Free Board.
6. Click **Use Demo Reactor** -> open Free Board -> click **Confirm** once.
   Trust score becomes `2` and status becomes `community_confirmed`; the post
   appears in Reliable Board.
7. Click **Use Demo Admin** -> Admin Review -> **Verify** the demo post. Status
   becomes `admin_verified` and a notification is created for Demo User.
8. Click **Use Demo User** -> Notifications to show the alerts.
9. Click **Reset Demo Data** to remove only the demo-created rows.

(Steps 5-6 can be replaced by a single **Run Full Demo** click, which stops at
`community_confirmed` and leaves admin verification manual.)

## Manual test checklist (A-G)

There is no automated test runner configured; verify via Swagger (`/docs`) or
curl. Replace `TOKEN` / `POST_ID` as noted.

```bash
# Test A — Demo User login (expect real JWT, roles = ["user"])
curl -X POST http://localhost:3000/demo/login/user

# Test B — Create demo post (expect status=free_board, trustScore=0)
curl -X POST http://localhost:3000/demo/create-post

# Test C — Reactor login (expect real JWT, role = user)
curl -X POST http://localhost:3000/demo/login/reactor

# Test D — One Confirm (use Reactor TOKEN + demo POST_ID)
#   expect confirm_count=1, trust_score=2, status=community_confirmed,
#   and the post shows on the Reliable Board
curl -X POST http://localhost:3000/community/posts/POST_ID/reactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reactionType":"confirm"}'
curl http://localhost:3000/community/posts/reliable-board

# Test E — Admin login (expect roles include admin)
curl -X POST http://localhost:3000/demo/login/admin

# Test F — Verify post (use Admin TOKEN; expect status=admin_verified + notification)
curl -X POST http://localhost:3000/admin/community/posts/POST_ID/verify \
  -H "Authorization: Bearer TOKEN"

# Test G — Reset (expect only demo data removed; real users/posts/CoreMap untouched)
curl -X POST http://localhost:3000/demo/reset
```

## Module structure

```
backend/src/modules/demo/
├── demo.routes.ts       # /demo/status, /demo/login/*, /demo/create-post, /demo/run-full, /demo/reset
├── demo.service.ts      # orchestration, reuses auth + community services
├── demo.repository.ts   # ensureDemoUser (idempotent) + strictly-scoped resetDemoData
├── demo.schema.ts       # DEMO_SAMPLE_POST content
└── demo.types.ts        # response types
```

Shared config lives in `backend/src/config/demo.ts`
(`isDemoModeEnabled`, `DEMO_USERS`, `DEMO_EMAILS`).

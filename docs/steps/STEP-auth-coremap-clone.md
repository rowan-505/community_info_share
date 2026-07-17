# STEP — CoreMap auth clone

Replaces the Community backend's own `community.users` auth with the shared
CoreMap auth system. The Community API now authenticates against the SAME
database, the SAME accounts, the SAME password hashes, the SAME roles, the SAME
JWT contract, and the SAME refresh-session flow as CoreMap. There is no second
auth system.

## Shared-auth goal

- One source of truth for users: `app_auth.auth_users` (shared with CoreMap).
- A valid CoreMap access token is accepted by the Community API when both use
  the same `JWT_SECRET` (same HS256 signing contract + `{ sub, email, roles }`
  claims).
- Community-owned data (`community.community_posts`, `notifications`,
  `post_reactions`) references shared users by internal bigint FK to
  `app_auth.auth_users.id`.

## Database tables reused (never duplicated)

| Table | Use |
|---|---|
| `app_auth.auth_users` | user identity, password hash, status |
| `app_auth.auth_roles` | role catalog (`user`, `admin`, `super_admin`, ...) |
| `app_auth.auth_user_roles` | user ↔ role assignment |
| `app_auth.auth_sessions` | refresh-token sessions (SHA-256 hash of token) |

The duplicate `community.users` table and its `user_role` / `user_status` enums
were dropped (they were empty). No CoreMap table is created, altered, or dropped.

## Source CoreMap behavior cloned

Endpoints (registered with no prefix):

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create a `user` account (no token) |
| POST | `/auth/login` | public | Email + password → tokens |
| POST | `/auth/refresh` | public (refresh token) | Rotate session, new access token |
| POST | `/auth/logout` | public (refresh token) | Revoke session (idempotent) |
| GET | `/auth/me` | Bearer | Current DB profile |

Not cloned (intentionally out of scope for this MVP): email OTP, points,
primary-region validation, legacy username login, import-review admin token,
and the dev `AUTH_BYPASS` shortcut.

## Register flow

```
POST /auth/register
  → Fastify JSON-schema validation (RegisterBody)
  → Zod parse (normalize email: trim + lowercase)
  → reject duplicate email with 409
  → hash password (Argon2id)
  → transaction:
      1. insert app_auth.auth_users
      2. find auth_roles where code = 'user'
      3. insert app_auth.auth_user_roles
  → re-read user with roles
  → 201 { "message": "Account created", "user": <profile> }
```

Registration issues NO JWT. Public signup can only ever assign the `user` role;
`admin` / `super_admin` are provisioned out-of-band.

## Login flow

```
POST /auth/login
  → validate + normalize email
  → find user by email (with roles) — 401 if missing
  → assertUserUsable: is_active AND account_status = 'active' — else 403
  → verifyPassword (Argon2id; bcryptjs fallback for $2a/$2b/$2y)
  → if needsRehash: best-effort re-hash to Argon2id (never blocks login)
  → update last_login_at + last_seen_at
  → issue opaque refresh token, store SHA-256 hash in auth_sessions (30d)
  → reply.jwtSign({ sub, email, roles }, { expiresIn: "15m" })
  → 200 { accessToken, refreshToken, expiresIn: "15m", user }
```

## Refresh flow

```
POST /auth/refresh
  → SHA-256 the presented refresh token
  → find active, non-revoked, non-expired session — 401 if none
  → assertUserUsable
  → revoke the presented session (rotation: old token becomes invalid)
  → issue a new session + new access token
  → 200 { accessToken, refreshToken, expiresIn: "15m", user }
```

## Logout flow

```
POST /auth/logout
  → SHA-256 the refresh token
  → revoke any matching non-revoked session (updateMany)
  → 200 { "message": "Logged out" }   # idempotent: unknown token is a no-op
```

## /auth/me flow

```
Authorization: Bearer <accessToken>
  → app.authenticate → request.jwtVerify() (populates sub/email/roles)
  → getMe(request.user.sub)  # sub is the public_id UUID
      → read app_auth.auth_users by public_id (+ roles)
      → assertUserUsable
  → 200 <profile>
```

The JWT is trusted only for identity (`sub`); the profile is always re-read from
the database, so stale JWT fields are never returned.

## Password hashing

- New hashes: **Argon2id** via `argon2` (`memoryCost: 19456`, `timeCost: 2`,
  `parallelism: 1`).
- Legacy hashes starting with `$2a$` / `$2b$` / `$2y$` verify via `bcryptjs` and
  are transparently upgraded to Argon2id on successful login (best-effort; a
  failed upgrade never blocks login).
- Malformed / unsupported hashes never authenticate.

## JWT contract

- Library `@fastify/jwt`, algorithm **HS256**, secret `JWT_SECRET`.
- Access token claims: `{ "sub": <public_id uuid>, "email": <string>, "roles": <string[]> }`.
- Access token TTL: `15m`. The internal bigint DB id is never placed in the token.
- Refresh token: opaque 32-byte base64url string (NOT a JWT); only its SHA-256
  hex hash is stored in `app_auth.auth_sessions.refresh_token_hash`. TTL: 30 days.

## Role system

- Real role codes: `user`, `admin`, `super_admin` (the DB also has `editor`,
  `viewer`). No `validator` role exists.
- Role loading: `auth_users → auth_user_roles → auth_roles → role.code[]`, copied
  verbatim into the JWT `roles` claim.
- Authorization helper: `app.requireRole(...allowedRoles)` — allows the request
  if `request.user.roles` contains at least one allowed code, else 403.
- Admin gate pattern: `[app.authenticate, app.requireRole("admin", "super_admin")]`
  (used by the admin-review routes).

## Account usability rules

A user is blocked (403) when `is_active = false` or `account_status != 'active'`.
Unknown user / missing token → 401.

## CommunityPost author relation

`community.community_posts.author_id` (bigint FK) → `app_auth.auth_users.id`.
The author is derived server-side from the authenticated user's `sub`
(public_id); clients cannot choose an arbitrary author. `notifications.user_id`
and `post_reactions.user_id` were repointed the same way.

## Environment variables

Required:

```
DATABASE_URL=            # shared CoreMap Supabase database
JWT_SECRET=              # MUST equal CoreMap's secret for cross-API tokens
NODE_ENV=development
```

Optional: `CORS_ORIGIN` (comma-separated allowlist), rate-limit vars
(`RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_MS`, `RATE_LIMIT_REGISTER_MAX`,
`RATE_LIMIT_REGISTER_WINDOW_MS`, ...), `PRISMA_CONNECTION_LIMIT`.

Never expose `JWT_SECRET` to frontend code.

## How to test

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev            # http://localhost:3000  (Swagger at /docs)

cd ../frontend
npm run dev
```

- A. `POST /auth/register` → 201, row in `auth_users` + `auth_user_roles` (role `user`).
- B. `POST /auth/login` → 200 with `accessToken`, `refreshToken`, `expiresIn = "15m"`, `roles`.
- C. Log in with an existing CoreMap account → succeeds, same `auth_users` row.
- D. `GET /auth/me` with `Authorization: Bearer <accessToken>` → shared profile + roles.
- E. `POST /auth/refresh` → new tokens; the old refresh token is now invalid.
- F. `POST /auth/logout` → session revoked; repeating it stays safe.
- G. Create a post while logged in → `author_id` = `auth_users.id`; author not client-chosen.
- H. A `user` is blocked from admin routes; `admin` / `super_admin` are allowed.
- I. With a matching `JWT_SECRET`, a CoreMap access token verifies on the Community API.

## Intentional differences from CoreMap

- No OTP, points, primary-region validation, legacy username login,
  import-review guard, or `AUTH_BYPASS`.
- `/auth/me` profile omits `total_points` (no points system here).
- Auth routes return raw CoreMap response shapes; the rest of the Community API
  keeps its existing `{ data }` envelope.
- The Community moderation endpoints (`/admin/users/:id/suspend|ban|unban`) were
  removed so this backend never mutates shared CoreMap account state.

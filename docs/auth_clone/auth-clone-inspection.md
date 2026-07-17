# Auth clone inspection

Read-only inspection of the CoreMap login/signup backend so it can be cloned into
another Fastify backend while keeping the same database auth system.

Source of truth tables (must stay authoritative):

- `app_auth.auth_users`
- `app_auth.auth_roles`
- `app_auth.auth_user_roles`

Roles that actually exist (seeded in migration 110): `user`, `admin`, `super_admin`.
There is **no** `validator` role and **no** `normal_user` role. "validator" in the
codebase only refers to code-review helper classes, not auth roles.

---

## 1. Signup pipeline

```text
Frontend register form (apps/web AuthContext.register)
  → POST /auth/register  (public, rate-limited: 5 / window)
  → Fastify JSON schema (postAuthRegisterSchema)
  → Zod parse (registerBodySchema)
  → AuthService.register()
       - normalize email (trim + lowercase)
       - reject if email already exists (409)
       - if primaryRegionId given, verify it exists in core.core_admin_areas (400 if not)
       - hashPassword() with Argon2id
  → AuthRepository.createPublicUser()  (single Prisma transaction)
       - look up auth_roles row where code = 'user' (500 if missing)
       - INSERT into app_auth.auth_users (is_active=true, defaults for language/status)
       - INSERT into app_auth.auth_user_roles (userId, roleId=user)
       - re-read user with roles
  → maps to AuthUserProfile
  → 201 { message: "Account created", user: <profile> }
```

Key facts:

- Registration does **not** issue a JWT. The frontend immediately calls `/auth/login`
  after a successful register (see `AuthContext.register`).
- Public registration can only ever create the `user` role. Admin / super_admin are
  provisioned out-of-band.
- Uniqueness is enforced twice: an explicit `findUserByEmail` check and a catch on
  Prisma `P2002` (unique violation) that also returns 409.

Files: `apps/api/src/modules/auth/auth.routes.ts` (`/auth/register`),
`auth.service.ts` (`register`), `auth.repo.ts` (`createPublicUser`),
`auth.schema.ts` (`registerBodySchema`), `password.ts` (`hashPassword`).

---

## 2. Login pipeline

```text
Frontend login form (apps/web AuthContext.login)
  → POST /auth/login  (public, rate-limited: AUTH_RATE_LIMIT_MAX, default 10 / window)
  → Fastify JSON schema (postAuthLoginSchema)
  → Zod parse (loginBodySchema)  — email OR legacy username, plus password
  → AuthService.login()
       - normalize email (username maps to "<username>@demo.local" legacy path)
       - AuthRepository.findUserByEmail() (includes roles) — 401 if not found
       - assertUserUsable(): is_active && account_status === 'active' else 403
       - verifyPassword(stored_hash, password) → { valid, needsRehash } — 401 if invalid
       - if needsRehash: re-hash to Argon2id and update (best-effort, never blocks login)
       - touchLastLogin() → update last_login_at + last_seen_at
       - issueSession(): generate opaque refresh token, store its SHA-256 hash in
         app_auth.auth_sessions with expiry (30 days)
  → route calls reply.jwtSign(accessTokenClaims, { expiresIn: "15m" })
  → 200 { accessToken, refreshToken, expiresIn: "15m", user: <minimal user> }
```

Files: `auth.routes.ts` (`/auth/login`, `issueSessionResponse`),
`auth.service.ts` (`login`, `issueSession`, `toAccessTokenClaims`, `toUserResponse`),
`auth.repo.ts` (`findUserByEmail`, `touchLastLogin`, `createSession`),
`password.ts` (`verifyPassword`), `refresh-token.ts` (`generateRefreshToken`,
`hashRefreshToken`, `refreshTokenExpiry`).

Related: `POST /auth/refresh` rotates the refresh token (consumes old, issues new,
re-signs access token). `POST /auth/logout` revokes the session by refresh-token hash
(idempotent).

---

## 3. GET /auth/me pipeline

```text
Authorization: Bearer <accessToken>
  → GET /auth/me
  → preHandler app.authenticate
       - if AUTH_BYPASS active (dev, non-production): set request.user = DEV_AUTH_BYPASS_USER, skip verify
       - else request.jwtVerify() → populates request.user from JWT payload (sub, email, roles)
  → route handler
       - if AUTH_BYPASS active: return the synthetic dev admin profile
       - else AuthService.getMe(request.user.sub)  (sub is the user public_id uuid)
            - AuthRepository.findProfileByPublicId(): read auth_users by public_id (+ roles)
            - read total_points from contrib.user_point_summary (0 if none)
            - assertUserUsable() → 401/403 if not usable
  → 200 <AuthUserProfile>
```

Note: `/auth/me` re-reads the database on every call (fresh profile + points). The JWT
itself is trusted for `sub`, `email`, `roles`; the profile fields are always DB-loaded.

Files: `plugins/auth.ts` (`authenticate`), `auth.routes.ts` (`/auth/me`),
`auth.service.ts` (`getMe`), `auth.repo.ts` (`findProfileByPublicId`, `getTotalPoints`).

---

## 4. Exact API endpoints

Auth routes are registered with **no prefix** (`app.register(authRoutes)` in `app.ts`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create `user` account |
| POST | `/auth/login` | public | Email/username + password → tokens |
| POST | `/auth/refresh` | public (needs refresh token) | Rotate session, new access token |
| POST | `/auth/logout` | public (needs refresh token) | Revoke session (idempotent) |
| GET | `/auth/me` | Bearer | Current user full profile |
| PATCH | `/me/profile` | Bearer | Self-service profile edit |
| POST | `/auth/email/send-otp` | Bearer | Send 6-digit email OTP (optional flow) |
| POST | `/auth/email/verify-otp` | Bearer | Verify email OTP |

Core clone set is register / login / refresh / logout / me. OTP + profile are optional.

---

## 5. Exact request DTOs

Register (`registerBodySchema`):

```jsonc
{
  "email": "string (trimmed, email)",
  "displayName": "string (2..120, trimmed)",
  "password": "string (8..200)",
  "preferredLanguage": "'my' | 'en' (optional)",
  "primaryRegionId": "positive int (optional)"
}
```

Login (`loginBodySchema`): either `email` or `username` (not both), plus `password`.

```jsonc
{
  "email": "string (email, optional)",
  "username": "string (min 3, optional, legacy)",
  "password": "string (min 6)"
}
```

Refresh / logout: `{ "refreshToken": "string (min 1)" }`

Update profile (`updateProfileBodySchema`, at least one field):

```jsonc
{
  "displayName": "string (2..120, optional)",
  "phone": "string (3..40) | null (optional)",
  "preferredLanguage": "'my' | 'en' (optional)",
  "primaryRegionId": "positive int | null (optional)"
}
```

Verify OTP: `{ "code": "string matching ^\\d{6}$" }`. Send OTP: empty body `{}`.

Validation is enforced twice: Fastify JSON Schema (`auth.openapi.ts`) at the framework
layer, then Zod (`auth.schema.ts`) inside each handler.

---

## 6. Exact response shapes

Minimal user (login / refresh) — `authUserSchema`:

```jsonc
{ "id": "string", "public_id": "uuid", "email": "string", "display_name": "string", "roles": ["string"] }
```

Session response (login / refresh) — `sessionResponseSchema`:

```jsonc
{
  "accessToken": "string (JWT)",
  "refreshToken": "string (opaque, base64url)",
  "expiresIn": "string ('15m')",
  "user": <minimal user>
}
```

Full profile (`/auth/me`, register `user`, `/me/profile`) — `authProfileSchema`:

```jsonc
{
  "id": "string",
  "public_id": "uuid",
  "email": "string",
  "display_name": "string",
  "phone": "string | null",
  "roles": ["string"],
  "email_verified": "boolean",
  "account_status": "string",
  "primary_region_id": "string | null",
  "preferred_language": "string",
  "total_points": "integer"
}
```

Register response: `{ "message": "Account created", "user": <full profile> }` (HTTP 201).
Logout: `{ "message": "Logged out" }`. OTP: `{ "status": "sent" | "verified" | "already_verified" }`.
Errors: `{ "message": "..." }` (validation errors also include `issues`).

---

## 7. Exact JWT payload fields

Access token claims (`AccessTokenClaims`, built by `toAccessTokenClaims`):

```jsonc
{
  "sub": "user public_id (uuid string)",
  "email": "string",
  "roles": ["string"]
}
```

`@fastify/jwt` also adds standard `iat` and (because `expiresIn` is set) `exp`.
`request.user` is typed as `JwtUser = { sub, id?, email, roles }` in `plugins/auth.ts`.
`id` is only present on the dev-bypass user, never on real tokens.

---

## 8. Exact JWT algorithm and expiration

- Library: `@fastify/jwt` `^10.0.0`, registered with `{ secret: process.env.JWT_SECRET }`.
- Algorithm: default HMAC **HS256** (symmetric string secret; no `alg` override in code).
- Access token TTL: **15 minutes** (`ACCESS_TOKEN_TTL = "15m"`, passed to `reply.jwtSign`).
- Refresh token: opaque random 32-byte base64url string, **not** a JWT. TTL **30 days**
  (`REFRESH_TOKEN_TTL_DAYS = 30`). Only its SHA-256 hex hash is stored in
  `app_auth.auth_sessions.refresh_token_hash`.
- Signing happens in the route (`reply.jwtSign`), not in the service. Verification happens
  in the `authenticate` decorator via `request.jwtVerify()`.

---

## 9. Exact password hashing library and configuration

File: `apps/api/src/modules/auth/password.ts`.

- New hashes: `argon2` `^0.44.0`, type **Argon2id**, options
  `{ memoryCost: 19456 (19 MiB), timeCost: 2, parallelism: 1 }`.
- Legacy verification: `bcryptjs` `^3.0.3`. Hashes starting with `$2a$`, `$2b$`, `$2y$`
  are verified with bcrypt and flagged `needsRehash`.
- `verifyPassword(storedHash, plain)` returns `{ valid, needsRehash }`. On successful login
  with a bcrypt or stale-argon2 hash, the service transparently re-hashes to Argon2id and
  updates `auth_users.password_hash` (best-effort, never blocks login).
- Malformed/unknown hashes never authenticate (return `valid: false`).

---

## 10. Exact database tables and columns used

Prisma schema: `apps/api/prisma/schema.prisma`. Schemas exposed:
`["app", "app_auth", "contrib", "core", "ref", "system"]`.

Core auth tables (source of truth):

`app_auth.auth_users` (Prisma `AuthUser`):

| Column | Prisma field | Type / notes |
|---|---|---|
| `id` | id | bigserial PK |
| `public_id` | publicId | uuid, unique, default `gen_random_uuid()` |
| `email` | email | text, unique |
| `password_hash` | passwordHash | text |
| `display_name` | displayName | text |
| `is_active` | isActive | boolean default true |
| `last_login_at` | lastLoginAt | timestamptz null |
| `created_at` / `updated_at` | createdAt / updatedAt | timestamptz |
| `phone` | phone | text null |
| `email_verified` | emailVerified | boolean default false |
| `account_status` | accountStatus | text default 'active' (CHECK: active/disabled/deleted) |
| `primary_region_id` | primaryRegionId | bigint null → core.core_admin_areas(id) |
| `preferred_language` | preferredLanguage | text default 'my' (CHECK: my/en) |
| `last_seen_at` | lastSeenAt | timestamptz null |
| `deleted_at` | deletedAt | timestamptz null |
| `admin_note` | adminNote | text null |

`app_auth.auth_roles` (Prisma `AuthRole`): `id`, `code` (unique), `name` (unique),
`description`, `is_system`, `created_at`, `updated_at`.

`app_auth.auth_user_roles` (Prisma `AuthUserRole`): `id`, `user_id` → auth_users,
`role_id` → auth_roles, `assigned_at`, `created_at`, unique `(user_id, role_id)`.

Supporting tables used by the full flow:

- `app_auth.auth_sessions` (`AuthSession`): refresh-token sessions — `refresh_token_hash`,
  `user_agent`, `ip_address`, `expires_at`, `revoked_at`, `last_used_at`.
- `app_auth.email_verification_otps` (`EmailVerificationOtp`): OTP flow (optional).
- `contrib.user_point_summary` (`UserPointSummary`): read for `total_points` in profile.
- `contrib.point_ledger` (`PointLedger`): points history (not used by core auth).
- `system.audit_logs` (`AuditLog`): written on email verification.
- `core.core_admin_areas` (`CoreAdminArea`): existence check for `primaryRegionId`.

Minimum tables to clone the core login/signup: `auth_users`, `auth_roles`,
`auth_user_roles`, `auth_sessions`. The rest are optional (OTP, points, audit, regions).

---

## 11. Exact role-loading logic

- Prisma include: `userRoles: { include: { role: true } }` (`userWithRolesInclude`).
- `mapRoles(user)` = `user.userRoles.map(ur => ur.role.code)` → `string[]` of role codes.
- Roles are attached to the record on login (`findUserByEmail`), on profile reads
  (`findProfileByPublicId`), and on refresh (`findActiveSessionByTokenHash` includes the user
  with roles). They are then copied verbatim into the JWT `roles` claim.
- Default role at signup: always `user` (looked up by `code = 'user'` and inserted into
  `auth_user_roles` inside the create transaction).

---

## 12. Exact authorization logic for admin and validator

There is no `validator` role. Authorization is role-code based.

Plugin factory (`plugins/auth.ts`):

```text
app.requireRole(...allowedRoles) → preHandler
  roles = request.user?.roles ?? []
  permitted = allowedRoles.some(r => roles.includes(r))
  if !permitted → 403 { message: "Insufficient role" }
```

Usage pattern across modules:

- Admin gate: `{ preHandler: [app.authenticate, app.requireRole("admin", "super_admin")] }`
  (search admin routes, reports admin, points admin, admin-users).
- Super-admin-only gate: `app.requireRole("super_admin")` (e.g. search index health reset).
- Finer-grained checks live in services, e.g. `admin-users.service.ts`:
  `PRIVILEGED_ROLES = {admin, super_admin}`; only `super_admin` may delete users, modify
  admin accounts, or assign/remove admin roles.
- Import-review uses its own guard (`import-review-admin.guard.ts`): a separate JWT verify
  plus a coarse `roles.includes("admin")` check, or an `IMPORT_REVIEW_ADMIN_TOKEN` header.
  Notably, `AUTH_BYPASS` does **not** apply to import-review.

Rule (from project rules): frontend hiding is never authorization — the API enforces it.

---

## 13. Exact environment variables required

Required for auth:

- `JWT_SECRET` — HMAC signing secret. The auth plugin throws at startup if missing.
- `DATABASE_URL` — Postgres/PostGIS connection for Prisma (source of truth).

Auth-adjacent / behavior:

- `NODE_ENV` — `production` disables `AUTH_BYPASS` (fail-fast) and locks CORS.
- `AUTH_BYPASS` — dev-only. `"true"` + non-production short-circuits JWT verification and
  injects a synthetic admin (`DEV_AUTH_BYPASS_USER`). Never active in production.
- `AUTH_RATE_LIMIT_MAX` (default 10) — cap for `POST /auth/login`.
- `AUTH_RATE_LIMIT_WINDOW` (default 60000 ms) — shared window; register=5, sendOtp=3,
  refresh=30 are fixed multiples.
- `CORS_ORIGIN` — comma-separated allowlist (required in production).
- `PRISMA_CONNECTION_LIMIT` (optional, default 1) — appended to `DATABASE_URL`.

Email OTP (optional flow only):

- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_OTP_SECRET`, `EMAIL_OTP_TTL_MINUTES` (default 10),
  `EMAIL_OTP_MAX_ATTEMPTS` (default 5). Without `EMAIL_OTP_SECRET`, OTP routes return 503.

`PUBLIC_APP_URL` is required by the env schema in production but is used for share links,
not by auth directly. Env parsing lives in `config/env.ts`; `JWT_SECRET` / `DATABASE_URL`
are read directly from `process.env` (not through the Zod schema).

---

## 14. All dependencies required by the auth system

Core (from `apps/api/package.json`):

- `fastify` `^5.8.5`
- `@fastify/jwt` `^10.0.0` — JWT sign/verify
- `fastify-plugin` `^5.1.0` — plugin decoration
- `@prisma/client` `^6.15.0` + `prisma` `^6.15.0` — DB access
- `argon2` `^0.44.0` — password hashing
- `bcryptjs` `^3.0.3` — legacy password verify
- `zod` `^4.3.6` — request validation
- `dotenv` `^16.6.1` — env loading

Used by the wider app but relevant here:

- `@fastify/cors` `^11.2.0` — CORS
- `@fastify/rate-limit` `^11.0.0` — per-IP limits on auth routes
- `@fastify/swagger` / `@fastify/swagger-ui` — OpenAPI docs (optional)

Optional (email OTP only): `resend` `^6.14.0`.

Node built-ins used: `node:crypto` (`randomBytes`, `createHash`, `createHmac`, `randomInt`,
`timingSafeEqual`).

---

## 15. All source files required to clone the system

Backend (must copy / adapt):

- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repo.ts`
- `apps/api/src/modules/auth/auth.schema.ts`
- `apps/api/src/modules/auth/auth.openapi.ts` (optional — OpenAPI only)
- `apps/api/src/modules/auth/password.ts`
- `apps/api/src/modules/auth/refresh-token.ts`
- `apps/api/src/plugins/auth.ts`
- `apps/api/src/plugins/prisma.ts`
- `apps/api/src/db/prisma.ts`
- `apps/api/prisma/schema.prisma` (at least the `AuthUser`, `AuthRole`, `AuthUserRole`,
  `AuthSession` models + the `app_auth` schema mapping)
- `apps/api/src/app.ts` (plugin/route registration order reference)
- `apps/api/src/config/env.ts` (if you reuse rate-limit/email env parsing)

Database:

- `infrastructure/database/migrations/supabase/110_user_system_mvp.sql` (table + role seed
  reference).

Frontend reference (only if you also clone the client):

- `apps/web/src/features/auth/api/http.ts`
- `apps/web/src/features/auth/api/authApi.ts`
- `apps/web/src/features/auth/lib/tokenStorage.ts`
- `apps/web/src/features/auth/state/AuthContext.tsx`
- `apps/web/src/features/auth/state/useAuth.ts`
- `apps/web/src/features/auth/types.ts`

Optional (email OTP): `apps/api/src/lib/security/otp.ts`, `modules/email/email.service.ts`.

---

## 16. CoreMap-specific dependencies that should not be copied blindly

- **Email OTP flow** (`send-otp` / `verify-otp`, `email_verification_otps`, Resend). Optional;
  drop unless the new backend needs email verification.
- **Points** (`total_points`, `contrib.user_point_summary`, `contrib.point_ledger`). The
  profile read joins `user_point_summary`; remove if there is no points system.
- **`primary_region_id`** validation against `core.core_admin_areas`. CoreMap map/region
  feature; remove for a non-map backend.
- **`preferred_language` (my/en)** and its CHECK constraint. Myanmar-specific.
- **Legacy username → `<username>@demo.local`** login mapping. Only needed for old CoreMap
  internal accounts.
- **`AUTH_BYPASS`** dev shortcut and `DEV_AUTH_BYPASS_USER`. Keep only if you want the same
  dev convenience; it is a security-sensitive path.
- **Import-review token guard** (`import-review-admin.guard.ts`, `IMPORT_REVIEW_ADMIN_TOKEN`).
  Unrelated to core auth.
- **`audit_logs`** writes on email verification (system schema convention).
- **Supabase pooling** (`PRISMA_CONNECTION_LIMIT`, connection-limit URL rewrite) — tune to
  the new host, not copy verbatim.
- **Multi-schema Prisma** (`app`, `app_auth`, `contrib`, `core`, `ref`, `system`). Keep only
  the schemas the auth tables live in (`app_auth`, plus `contrib`/`system` if used).
- **Rate-limit split** (register/login/refresh/sendOtp specific numbers) — review for the new
  app's traffic.

---

## 17. Clone checklist (reproduce in another Fastify backend)

1. Create the `app_auth` schema with `auth_users`, `auth_roles`, `auth_user_roles`, and
   `auth_sessions` (see migration 110). Seed roles `user`, `admin`, `super_admin`.
2. Add Prisma models `AuthUser`, `AuthRole`, `AuthUserRole`, `AuthSession` with the same
   `@map`/`@@map`/`@@schema` mappings. Add `UserPointSummary` / OTP / audit only if you keep
   those features.
3. Install deps: `fastify`, `@fastify/jwt`, `fastify-plugin`, `@prisma/client` + `prisma`,
   `argon2`, `bcryptjs`, `zod`, `dotenv` (and `@fastify/cors`, `@fastify/rate-limit` if used).
4. Set env: `JWT_SECRET` (required), `DATABASE_URL` (required), plus `NODE_ENV`,
   `CORS_ORIGIN`, and rate-limit vars as needed.
5. Copy `password.ts` (Argon2id + bcrypt fallback) and `refresh-token.ts` (opaque token +
   SHA-256 hash + 30-day expiry). Confirm `ACCESS_TOKEN_TTL = "15m"`.
6. Copy `plugins/prisma.ts`, `db/prisma.ts`, and `plugins/auth.ts`. Register the JWT plugin
   with `{ secret: process.env.JWT_SECRET }`; decorate `authenticate` (calls `request.jwtVerify`)
   and `requireRole(...)`.
7. Copy `auth.repo.ts` (Prisma queries + role mapping), `auth.service.ts` (register / login /
   refresh / logout / getMe), and `auth.schema.ts` (Zod DTOs). Drop OTP/points/region logic if
   not needed.
8. Copy `auth.routes.ts`. Ensure the JWT is signed in the route via
   `reply.jwtSign(claims, { expiresIn: ACCESS_TOKEN_TTL })` with claims `{ sub: public_id,
   email, roles }`.
9. Register in `app.ts` in order: cors → rate-limit → prisma plugin → auth plugin → auth
   routes. Auth routes use no prefix (`/auth/...`, `/me/profile`).
10. Protect routes with `{ preHandler: [app.authenticate, app.requireRole("admin",
    "super_admin")] }`. Never rely on frontend hiding.
11. Verify pipelines end-to-end:
    - `POST /auth/register` → 201, row in `auth_users` + `auth_user_roles` (role `user`).
    - `POST /auth/login` → 200 with `accessToken` (JWT), `refreshToken`, `user`.
    - `GET /auth/me` with `Authorization: Bearer <accessToken>` → full profile.
    - `POST /auth/refresh` rotates the refresh token; old token becomes invalid.
    - `POST /auth/logout` revokes the session (idempotent).
12. Confirm password upgrade path: an existing bcrypt hash logs in and is silently re-hashed to
    Argon2id.
13. Confirm `AUTH_BYPASS` is impossible in production (`assertAuthBypassNotInProduction`).

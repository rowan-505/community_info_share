# Auth clone file map

Each CoreMap source file relevant to the login/signup auth system, with its purpose.
Paths are relative to the repo root.

## Backend — auth module (`apps/api/src/modules/auth/`)

| File | Purpose |
|---|---|
| `auth.routes.ts` | Fastify route handlers for `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/me/profile`, and the two email-OTP routes. Signs the access JWT via `reply.jwtSign` and applies per-IP rate limits. |
| `auth.service.ts` | Business logic: register, login, refresh, logout, getMe, updateProfile, and OTP flows. Owns `AuthError`, JWT-claim shaping, email normalization, and the legacy username mapping. |
| `auth.repo.ts` | All Prisma database access for auth. Reads/writes `auth_users`, `auth_user_roles`, `auth_sessions`, OTPs, points summary, and audit logs. Maps DB rows to `AuthUserRecord` / `AuthUserProfile` and turns roles into `string[]`. |
| `auth.schema.ts` | Zod schemas for request bodies and response shapes (register, login, refresh, logout, profile, OTP). Runtime validation inside handlers. |
| `auth.openapi.ts` | Fastify JSON Schema definitions used for OpenAPI docs and framework-level request/response validation. Mirrors the Zod schemas. |
| `password.ts` | Password hashing/verification. Argon2id for new hashes; bcryptjs fallback for legacy hashes with `needsRehash` upgrade signalling. |
| `refresh-token.ts` | Refresh-token helpers: generate opaque token, SHA-256 hash for storage, expiry window (30 days), and the `ACCESS_TOKEN_TTL = "15m"` constant. |

## Backend — plugins and DB (`apps/api/src/`)

| File | Purpose |
|---|---|
| `plugins/auth.ts` | Registers `@fastify/jwt` with `JWT_SECRET`, decorates `app.authenticate` (JWT verify + dev bypass) and `app.requireRole(...)` (role gate). Declares the `JwtUser` type and the production bypass guard. |
| `plugins/prisma.ts` | Decorates the Fastify instance with the shared `PrismaClient` as `app.prisma`. |
| `db/prisma.ts` | Creates the singleton `PrismaClient` (one pool per process), applies the Supabase connection-limit tweak, and registers shutdown hooks. |
| `config/env.ts` | Zod-validated env parsing for rate limits, email OTP, routing, and public URL. Provides `getApiEnv()` and rate-limit config used by the auth routes. |
| `lib/security/otp.ts` | OTP helpers: generate a 6-digit code, HMAC-SHA256 hash it, and constant-time hex compare. Used only by the optional email-verification flow. |
| `app.ts` | App assembly: registers CORS, rate-limit, prisma plugin, auth plugin, and auth routes (no prefix). Reference for the correct registration order. |

## Database (`infrastructure/database/`)

| File | Purpose |
|---|---|
| `migrations/supabase/110_user_system_mvp.sql` | Reproducible migration: additive `auth_users` columns, role seed (`user`, `admin`, `super_admin`), and creates `auth_sessions`, `email_verification_otps`, and the points/audit tables. Source-of-truth reference for table shapes. |

## Prisma schema (`apps/api/prisma/`)

| File | Purpose |
|---|---|
| `schema.prisma` | Prisma models and multi-schema mapping. Auth-relevant models: `AuthUser` (`app_auth.auth_users`), `AuthRole` (`app_auth.auth_roles`), `AuthUserRole` (`app_auth.auth_user_roles`), `AuthSession` (`app_auth.auth_sessions`), plus optional `EmailVerificationOtp`, `UserPointSummary`, `AuditLog`, `CoreAdminArea`. |

## Frontend — web auth feature (`apps/web/src/features/auth/`)

| File | Purpose |
|---|---|
| `api/http.ts` | Fetch wrapper with API base URL, bearer-token injection, JSON handling, and a single transparent refresh-on-401 retry. Exposes `publicJson`, `authJson`, and session-cleared listeners. |
| `api/authApi.ts` | Typed client functions calling `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/me/profile`, and OTP endpoints. Defines exact request bodies. |
| `lib/tokenStorage.ts` | Stores `accessToken` and `refreshToken` in `localStorage` (keys `accessToken` / `refreshToken`) with get/set/clear helpers. |
| `state/AuthContext.tsx` | React provider wiring login/register/logout/profile refresh. Register auto-logins because register issues no token. |
| `state/useAuth.ts` | Auth context definition and hook (context value + modal view types). |
| `types.ts` | TypeScript mirrors of the API auth responses: `AuthUser`, `AuthProfile`, `SessionResponse`, and the register/login/update input types. |

## Not part of core auth (do not clone blindly)

| File | Why it is separate |
|---|---|
| `modules/import-review/import-review-admin.guard.ts` | Independent admin guard using `IMPORT_REVIEW_ADMIN_TOKEN` or a coarse `admin` role check. `AUTH_BYPASS` does not apply here. |
| `modules/admin-users/admin-users.service.ts` | Finer-grained admin/super_admin authorization rules (privileged-role logic), specific to user administration. |
| `modules/email/email.service.ts` | Resend-based email sending for OTP. Optional dependency. |

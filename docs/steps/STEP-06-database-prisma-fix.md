> **Fix note:** This step documents a database schema fix applied on top of [STEP-06-database-prisma.md](./STEP-06-database-prisma.md). It does not change the app architecture (route → service → repository → Prisma → PostgreSQL).

# STEP-06 (fix): Prisma database schema fix — move Community tables into a dedicated `community` schema

## Runtime error being fixed

```
The table `public.CommunityPost` does not exist in the current database.
```

`GET /community/posts/free-board` and `GET /community/posts/reliable-board` returned HTTP 500.

## Cause of the Prisma error

The project now points `DATABASE_URL` at the **shared CoreMap Supabase PostgreSQL** database. Inspecting that database showed:

- `public` contains only PostGIS system tables (`geography_columns`, `geometry_columns`, `spatial_ref_sys`).
- There is **no `_prisma_migrations` table** — so none of the project's previous migrations were ever applied to this database.
- The `community` schema did not exist.

The old Prisma models had **no schema mapping**, so Prisma defaulted every model to the `public` schema and generated queries against `public."CommunityPost"`. That table was never created in the shared Supabase database, so every read failed with *table does not exist*.

## Old expected table vs. new actual table

| | Old (broken) | New (fixed) |
|---|---|---|
| Schema | `public` | `community` |
| Table | `CommunityPost` (PascalCase, unmapped) | `community_posts` (snake_case, mapped) |
| Fully-qualified | `public."CommunityPost"` | `community.community_posts` |

## Prisma mapping

`multiSchema` is now GA in Prisma 6.19.3, so the datasource declares the schemas it manages and every model/enum is annotated. Only the `community` schema is listed — the existing CoreMap schemas (`app_auth`, `feedback`, `core`, `transport`, `routing`, `search`, …) are intentionally **not** listed, so Prisma never diffs, drops, or manages them.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["community"]
}

model CommunityPost {
  // ...fields...
  @@map("community_posts")
  @@schema("community")
}
```

Full model → table map (all in schema `community`):

| Prisma model | DB table |
|---|---|
| `User` | `community.users` |
| `CommunityPost` | `community.community_posts` |
| `PostReaction` | `community.post_reactions` |
| `Notification` | `community.notifications` |

Model names and Prisma field names are unchanged, so the client accessors (`prisma.communityPost`, `prisma.user`, `post.publicId`, …) and all repository/service/route code keep working with no code changes. Only the physical DB naming changed via `@map`/`@@map`.

Room to grow later in the same schema: `community.post_reactions` (already added), `community.notifications` (already added), and future `community.moderation_actions`.

## Supabase best-practices review (skill: `supabase-postgres-best-practices` + `supabase`)

The generated migration was reviewed against the Supabase Postgres skill and hardened. Changes applied:

| Rule | Impact | Before | After |
|---|---|---|---|
| `schema-lowercase-identifiers` | MEDIUM | Mixed-case quoted columns (`"publicId"`) and enum types (`"UserRole"`) | snake_case everywhere (`public_id`, `user_role`) via `@map`/`@@map` |
| `schema-data-types` | HIGH | `TIMESTAMP(3)` (no timezone) | `TIMESTAMPTZ(6)` via `@db.Timestamptz(6)` |
| `schema-foreign-key-indexes` | HIGH | FK columns `notifications.related_post_id` and `post_reactions.user_id` unindexed | Added `@@index([relatedPostId])` and `@@index([userId])` |
| `security-rls-basics` / skill rule #5 | CRITICAL | No RLS | `ENABLE ROW LEVEL SECURITY` on all 4 tables (defense-in-depth) |
| `schema-constraints` | HIGH | Non-idempotent DDL | Enums/tables/indexes/constraints made idempotent (`IF NOT EXISTS` + `duplicate_object` guards) |

**RLS detail:** `community` is a private schema (not exposed to the Supabase Data API), and the backend connects via Prisma as the table **owner**, which bypasses RLS. RLS is `ENABLE`d but **not** `FORCE`d, so the owner/backend keeps full access while the `anon`/`authenticated` API roles get zero rows by default (no policies = no access) if the schema is ever exposed. No `GRANT`s were added to API roles (least privilege).

**Deliberately not changed:** primary keys stay `bigserial` (Prisma 6 generates this for `autoincrement()`; it is already sequential, avoiding the UUIDv4-PK fragmentation the skill warns about). Switching to `GENERATED ALWAYS AS IDENTITY` would create Prisma drift, so it was left as-is.

## ⚠️ Auth / User model note (important)

The CoreMap database already has its own authentication tables in the **`app_auth`** schema (`auth_users`, `auth_roles`, `auth_sessions`, `auth_user_roles`), plus Supabase's built-in `auth.users`.

This project's Prisma `User` model is a **separate, self-contained auth table for the Community app**. To avoid touching or duplicating CoreMap auth, it was placed at **`community.users`** — it does **not** create, modify, or duplicate anything in `app_auth` or `auth`. No CoreMap auth tables were changed.

If the Community app should instead reuse CoreMap's `app_auth.auth_users`, that is a deliberate integration decision and must be designed separately — it was **not** done here.

## Migration created

Because the shared database had no Prisma migration history, the previous 5 `public`-targeted migrations (which had never been applied here) were consolidated into a single clean baseline:

```
backend/prisma/migrations/20260715120000_init_community_schema/migration.sql
```

It is purely additive and idempotent:

- `CREATE SCHEMA IF NOT EXISTS "community";`
- creates the enums and the 4 tables (`users`, `community_posts`, `post_reactions`, `notifications`) inside `community`, all with `timestamptz` timestamps, indexed foreign keys, and RLS enabled
- guarded so it can be safely re-run (`IF NOT EXISTS` + `duplicate_object` exception blocks)
- **no** `DROP SCHEMA`, **no** `DROP TABLE`, **no** reset — existing CoreMap schemas and tables are untouched.

**Verified against a throwaway Postgres 16** (not the Supabase DB): the migration applied cleanly, was confirmed idempotent by applying it twice, `prisma migrate diff` reported **"No difference detected"** (zero drift vs. the schema), and owner writes/reads succeeded with RLS enabled.

## Exact safe migration command

Apply pending migrations without a shadow database and without any reset:

```bash
cd backend
npx prisma migrate deploy
```

`migrate deploy` only runs pending migration files and records them in `_prisma_migrations`. It never drops or resets. **Do not** run `prisma migrate reset` or `prisma migrate dev` against the shared Supabase database.

Optional demo data (safe, uses `upsert`):

```bash
npm run db:seed
```

## How to verify the table exists

Via psql / Supabase SQL editor:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'community'
ORDER BY table_name;
-- expect: community_posts, notifications, post_reactions, users
```

Or with Prisma:

```bash
cd backend
npx prisma db execute --stdin <<'SQL'
SELECT to_regclass('community.community_posts') AS community_posts;
SQL
```

Then confirm the API:

```bash
curl http://localhost:3000/community/posts/free-board      # 200, { "data": [...] }
curl http://localhost:3000/community/posts/reliable-board  # 200
curl http://localhost:3000/community/posts/<publicId>      # 200 / 404
# POST /community/posts requires a JWT (register/login first)
```

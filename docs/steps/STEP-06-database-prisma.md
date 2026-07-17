> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-06: Database with Prisma

## What changed

Community post storage moved from in-memory arrays to PostgreSQL via Prisma. The API shape is unchanged; the frontend still calls Fastify only.

## Roles

| Component | Role |
|-----------|------|
| **PostgreSQL** | Persistent database. Stores users and posts. |
| **Prisma** | ORM. Defines models, generates client, runs queries. |
| **Migrations** | Version-controlled SQL schema changes in `prisma/migrations/`. |
| **Seed** | Inserts demo user and sample posts for local development. |

## Models

### User

| Field | Type | Notes |
|-------|------|-------|
| id | BigInt | Internal primary key (not exposed in API) |
| publicId | UUID | External identifier |
| email | String | Unique |
| passwordHash | String | Stored but never returned in API |
| displayName | String | Shown as `authorName` on posts |
| role | Enum | `user`, `admin` |
| status | Enum | `active`, `inactive` |
| createdAt / updatedAt | DateTime | Timestamps |

### CommunityPost

| Field | Type | Notes |
|-------|------|-------|
| id | BigInt | Internal primary key (not exposed in API) |
| publicId | UUID | Used in API routes and responses |
| authorId | BigInt | Foreign key → User.id |
| title, description, topic | String | Post content |
| status | Enum | Post lifecycle status |
| trustScore | Int | Default 10 for new posts |
| createdAt / updatedAt | DateTime | Timestamps |

### Relationship

```
User (1) ──< CommunityPost (many)
```

- Each post belongs to one user via `authorId`.
- API routes use `publicId` (UUID), not internal BigInt IDs.
- New posts are assigned to the seeded demo user until authentication is added.

## Configure DATABASE_URL

Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Set `DATABASE_URL` to your PostgreSQL or Supabase connection string:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

**Do not** connect the frontend directly to Supabase. All data access goes through the Fastify API.

## Commands

### Generate Prisma client

```bash
cd backend
npm run db:generate
```

### Run migration

```bash
cd backend
npm run db:migrate
```

Creates/applies migration files in `prisma/migrations/`.

### Seed database

```bash
cd backend
npm run db:seed
```

Inserts:
- 1 demo user (`demo@community.local`, display name `demo_user`)
- 5 sample community posts

### Run backend

```bash
cd backend
npm run dev
```

## Test

```bash
curl http://localhost:3000/community/posts/free-board
curl http://localhost:3000/community/posts/reliable-board
curl http://localhost:3000/community/posts/22222222-2222-4222-8222-222222222002
```

## State at Step 6

- Authentication was added in STEP-07
- Admin Review UI was connected in STEP-09
- Seed users now have real password hashes (see STEP-07 and seed file)

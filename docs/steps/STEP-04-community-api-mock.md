> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-04: Community API (Mock)

## What was created

An in-memory community-posts module following route → service → repository → mock data.

## Flow

```
HTTP request
  → community-posts.routes.ts   (parse request, validate with Zod)
  → community-posts.service.ts    (business rules)
  → community-posts.repository.ts (read/write in-memory array)
  → mock seed data
```

## Module files

| File | Purpose |
|------|---------|
| `community-posts.routes.ts` | HTTP endpoints |
| `community-posts.service.ts` | Filtering and not-found logic |
| `community-posts.repository.ts` | In-memory storage and seed data |
| `community-posts.schema.ts` | Zod validation for create post |
| `community-posts.types.ts` | TypeScript types |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/community/posts/free-board` | Active public posts (`free_board`, `community_confirmed`, `admin_verified`) |
| GET | `/community/posts/reliable-board` | Verified posts (`community_confirmed`, `admin_verified`) |
| GET | `/community/posts/:publicId` | Single post by public ID |
| POST | `/community/posts` | Create a new post (starts as `free_board`) |

## Post fields

- `id` — internal ID
- `publicId` — public identifier for URLs
- `title`
- `description`
- `topic`
- `authorName`
- `status`
- `trustScore`
- `createdAt`

## Statuses

`free_board`, `community_confirmed`, `admin_verified`, `rejected`, `resolved`, `expired`

New posts are created with `free_board` status and default `trustScore` of 10.

## Mock storage

- Data lives in a module-level array inside `community-posts.repository.ts`.
- Five sample posts are seeded on startup.
- Created posts are prepended to the array.
- Data is lost when the server restarts.

## Limitations

- No PostgreSQL or Prisma yet
- No authentication (author defaults to `anonymous` if omitted)
- No persistence across restarts
- No reactions, admin actions, or trust-score algorithms yet
- Single-process only (not shared across instances)

## How to test

Start the server:

```bash
cd backend
npm run dev
```

### Free Board

```bash
curl http://localhost:3000/community/posts/free-board
```

### Reliable Board

```bash
curl http://localhost:3000/community/posts/reliable-board
```

### Get by public ID

```bash
curl http://localhost:3000/community/posts/post-002
```

### Create post

```bash
curl -X POST http://localhost:3000/community/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test post","description":"A test description","topic":"General","authorName":"test_user"}'
```

### Validation error

```bash
curl -X POST http://localhost:3000/community/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"","description":"Missing title"}'
```

### Not found

```bash
curl http://localhost:3000/community/posts/unknown-id
```

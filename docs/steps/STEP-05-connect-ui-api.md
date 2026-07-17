> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-05: Connect UI to API

## What changed

The frontend Free Board, Reliable Board, and Create Post views now call the Fastify backend.

**Updated in later steps:** Admin Review, reactions, auth, and database were added in STEP-06 to STEP-10.

## Frontend → API flow

```
View (FreeBoard / ReliableBoard / CreatePost)
  → communityPostsApi.ts (single API client)
  → fetch → Fastify backend
  → community-posts.routes.ts
  → JSON response
```

All HTTP calls go through `frontend/src/api/communityPostsApi.ts`. Components do not call `fetch` directly.

## API client

| Function | Endpoint |
|----------|----------|
| `getFreeBoardPosts()` | GET `/community/posts/free-board` |
| `getReliableBoardPosts()` | GET `/community/posts/reliable-board` |
| `createPost()` | POST `/community/posts` |

## Environment variable

Create `frontend/.env` from the example:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API base URL |

## How to run frontend and backend together

Terminal 1 — backend:

```bash
cd backend
npm install
npm run dev
```

Terminal 2 — frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## What to test

1. **Free Board** — loads posts from API; shows loading then data
2. **Reliable Board** — loads verified posts only
3. **Create Post** — submit form; redirects to Free Board with new post visible
4. **Admin Review** — added in STEP-09 (uses real API)
5. **Error state** — stop backend and reload Free Board; error message appears

## State at Step 5

At this step only, Admin Review and reactions were still local. The full MVP connects everything to the API.

> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-08: Reactions and Trust Score

## What changed

Users can react to posts via the API. Reactions are stored in PostgreSQL. Trust score is recalculated after each reaction. Posts can be auto-promoted to `community_confirmed`.

## Reaction flow

```
POST /community/posts/:publicId/reactions { reactionType }
  → authenticate JWT
  → upsert PostReaction (one per user per post)
  → recalculate trustScore from all reactions
  → maybe update status to community_confirmed
  → return updated post with reaction counts
```

If the same user reacts again on the same post, their existing reaction is updated (not duplicated).

## Trust score calculation

Each reaction on a post contributes points:

| Reaction | Points |
|----------|--------|
| confirm  | +2     |
| useful   | +1     |
| fake     | -3     |
| resolved | 0      |

`trustScore` = sum of points from all current reactions on the post.

## Automatic community confirmation

After recalculating trust score:

- If `trustScore >= 8` and status is `free_board` → change to `community_confirmed`
- **Not applied** when status is `rejected`, `expired`, or `resolved`
- `admin_verified` posts are not downgraded or changed

## Database relationship

```
User (1) ──< PostReaction (many) >── (1) CommunityPost
```

- `PostReaction.postId` → `CommunityPost.id` (BigInt, internal)
- `PostReaction.userId` → `User.id` (BigInt, internal)
- Unique constraint on `(postId, userId)` — one reaction per user per post
- API uses `publicId` (UUID) in routes, never internal BigInt IDs

## Migration

```bash
cd backend
npm run db:migrate
```

Applies `20260710160000_add_post_reactions`.

## Test

```bash
# Login first, then react (replace TOKEN and POST_PUBLIC_ID)
curl -X POST http://localhost:3000/community/posts/POST_PUBLIC_ID/reactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reactionType":"confirm"}'
```

Frontend: log in, open Free Board, click reaction buttons — counts, trust score, and status update from API.

## State at Step 8

- Reactions require login
- One reaction type per user per post (latest choice wins)
- Admin Review UI was connected in STEP-09

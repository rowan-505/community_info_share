> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-09: Admin Review

## What changed

Admins and validators can review all community posts via protected API routes. The frontend Admin Review page now uses the real backend.

## Role authorization

| Role | Access |
|------|--------|
| `admin` | Full admin review access |
| `validator` | Full admin review access |
| `user` | Denied (403 Forbidden) |
| Not logged in | Denied (401 Unauthorized) |

Flow:
1. `authenticate` — verify JWT token
2. `authorizeReviewer` — load user role from database
3. Allow only if role is `admin` or `validator`

## Admin review flow

```
GET /admin/community/posts
  → list all CommunityPost records

POST /admin/community/posts/:publicId/{action}
  → update post status in database
  → return updated post
```

No separate ticket model. Reviews operate directly on `CommunityPost`.

## Status changes

| Action | New status |
|--------|------------|
| verify | `admin_verified` |
| reject | `rejected` |
| resolve | `resolved` |
| expire | `expired` |

## API routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/community/posts` | admin, validator |
| POST | `/admin/community/posts/:publicId/verify` | admin, validator |
| POST | `/admin/community/posts/:publicId/reject` | admin, validator |
| POST | `/admin/community/posts/:publicId/resolve` | admin, validator |
| POST | `/admin/community/posts/:publicId/expire` | admin, validator |

## Seed users for testing

After `npm run db:seed`:

| Email | Role | Password |
|-------|------|----------|
| admin@community.local | admin | password123 |
| validator@community.local | validator | password123 |
| demo@community.local | user | password123 |

## Migration

```bash
cd backend
npm run db:migrate
npm run db:seed
```

Adds `validator` to the `UserRole` enum.

## Test

1. Log in as `admin@community.local` / `password123`
2. Open Admin Review — all posts load from API
3. Click Verify / Reject / Resolve / Expire — status updates in database
4. Log in as regular user — Admin Review shows access denied
5. Call admin API without token — 401

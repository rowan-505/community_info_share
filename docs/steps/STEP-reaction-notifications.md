> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-reaction-notifications: Reaction notifications

## Purpose

When another user reacts to a community post, the post's author now receives an
in-app notification that shows who reacted, which reaction was used, which post,
and when. Example:

```
Demo Reactor confirmed your post "Road flooded near market"
```

This is a minimal MVP: no push, email, WebSocket, realtime, grouping, or queues.
It reuses the existing notification system and the shared CoreMap `app_auth`
users — no new user table and no duplicate notification table.

## Reaction notification flow

```
User clicks reaction
  -> POST /community/posts/:publicId/reactions   (authenticate + active account)
  -> validate reaction type (Zod)
  -> [transaction]
       read previous reaction (to detect change vs no-op)
       upsert PostReaction
       recalculate trust score
       update post status if needed (+ status-change notification)
       create post_reaction notification for the author (if rules pass)
  -> return updated post
```

Everything runs in the existing `route -> service -> repository -> Prisma ->
PostgreSQL` structure and inside the same transaction as the reaction, so the
notification is only written after the reaction is successfully stored.

Files: [community-posts.repository.ts](../../backend/src/modules/community-posts/community-posts.repository.ts)
(`upsertReaction`), [notifications.repository.ts](../../backend/src/modules/notifications/notifications.repository.ts)
(`createForReaction`), [notifications.types.ts](../../backend/src/modules/notifications/notifications.types.ts)
(`reactionNotificationContent`).

## Notification model / table

Reuses the existing `community.notifications` table (Prisma model
`Notification`). Two nullable columns were added additively:

| Field | Column | Notes |
|-------|--------|-------|
| `actorUserId` | `actor_user_id` (BIGINT, null) | FK -> `app_auth.auth_users(id)`, `ON DELETE SET NULL` |
| `reactionType` | `reaction_type` (`community.reaction_type`, null) | which reaction triggered it |

A new enum value `post_reaction` was added to `community.notification_type`.
Recipient (`user_id`) = post author's internal DB id; actor (`actor_user_id`) =
reacting user's internal DB id; `related_post_id` = the post. Public UUIDs are
used for API-facing identifiers.

Migration: [20260715140000_reaction_notifications](../../backend/prisma/migrations/20260715140000_reaction_notifications/migration.sql)
— additive and idempotent (`ADD VALUE IF NOT EXISTS`, `ADD COLUMN IF NOT
EXISTS`, guarded FK). It never drops, truncates, resets, or alters `app_auth`.

## Message mapping

| Reaction | Message |
|----------|---------|
| `confirm` | `{actor} confirmed your post "{title}"` |
| `useful` | `{actor} marked your post as useful "{title}"` |
| `fake` | `{actor} marked your post as fake "{title}"` |
| `resolved` | `{actor} marked your post as resolved "{title}"` |

The actor name is the real `display_name` from `app_auth.auth_users` — no demo
usernames are hardcoded in production logic.

## Self-reaction rule

A `post_reaction` notification is created only when the reactor is **not** the
post author (`post.authorId !== reactor.id`). Reacting to your own post creates
no notification. (Self-reactions are otherwise still allowed by the reaction
flow; this step only suppresses the notification.)

## Duplicate-reaction rule

The previous reaction type is read before the upsert:

- New reaction (none before) -> notify.
- Changed reaction (e.g. `confirm` -> `useful`) -> notify with the new reaction.
- Identical repeat (e.g. `confirm` -> `confirm`) -> no new notification.

## API routes (reused, unchanged signatures)

- `GET /notifications` — authenticated; returns only the current user's
  notifications, newest first.
- `PATCH /notifications/:publicId/read` — authenticated; only the owner can mark
  their own notification read (others get `403`).

### Response shape

```json
{
  "id": "uuid",
  "publicId": "uuid",
  "type": "post_reaction",
  "reactionType": "confirm",
  "title": "New reaction on your post",
  "message": "Demo Reactor confirmed your post \"Road flooded near market\"",
  "relatedPostPublicId": "uuid",
  "actor": { "publicId": "uuid", "displayName": "Demo Reactor" },
  "relatedPost": { "publicId": "uuid", "title": "Road flooded near market" },
  "isRead": false,
  "createdAt": "2026-07-15T..."
}
```

Status-change notifications keep working; they have `reactionType: null` and
`actor: null`.

## Privacy rule

`GET /notifications` filters by the authenticated user's `publicId`, and
`PATCH /notifications/:publicId/read` verifies ownership before updating. One
user can never read or mark another user's notification.

## Demo flow

1. Log in / use **Demo User**, create a post.
2. Use **Demo Reactor**, open Free Board, click **Confirm** once.
3. Trust score becomes `2`; the demo post may auto-promote to
   `community_confirmed` (demo threshold from STEP-demo-mode).
4. Use **Demo User** -> Notifications:
   - `Demo Reactor confirmed your post "..."` (reaction notification)
   - `Your post "..." was community confirmed.` (status notification)

## How to test

Apply the migration first (additive; never resets):

```bash
cd backend && npm run db:migrate:deploy
```

Then, using the demo routes (`DEMO_MODE=true`) or real accounts:

```bash
# A — Confirm notification: Demo User post, Demo Reactor confirms -> author gets
#     a "confirmed your post" notification.
# B — Useful notification: same reactor changes to useful -> new "marked your
#     post as useful" notification.
# C — Duplicate: send confirm again unchanged -> no new notification.
# D — Self-reaction: author reacts to own post -> no notification.
# E — Privacy: GET /notifications as user B never returns user A's rows.
# F — Mark read: PATCH /notifications/:publicId/read only works for the owner.

# React (reactor TOKEN + POST_ID):
curl -X POST http://localhost:3000/community/posts/POST_ID/reactions \
  -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
  -d '{"reactionType":"confirm"}'

# Author reads their notifications:
curl http://localhost:3000/notifications -H "Authorization: Bearer AUTHOR_TOKEN"
```

There is no automated test runner in the repo; verify via curl or Swagger
(`/docs`).

> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-10: Notifications

## What changed

A simple in-app notification system notifies post authors when their post status changes. No push, email, or WebSocket.

## When notifications are created

A notification is created for the **post author** when status changes to:

| New status | Trigger source |
|------------|----------------|
| `community_confirmed` | Reactions push trust score ≥ 8 |
| `admin_verified` | Admin verify action |
| `rejected` | Admin reject action |
| `resolved` | Admin resolve action |
| `expired` | Admin expire action |

Notifications are only created when the status **actually changes** (not on duplicate updates).

## How they are stored

```
Notification
  → userId (post author)
  → relatedPostId (optional link to CommunityPost)
  → type, title, message
  → isRead (default false)
  → publicId (UUID for API)
```

Stored in PostgreSQL via Prisma. Internal BigInt IDs are not exposed in the API.

## How users read them

```
GET /notifications
  → authenticate JWT
  → return only current user's notifications

PATCH /notifications/:publicId/read
  → authenticate JWT
  → verify notification belongs to current user
  → set isRead = true
```

Users cannot read or mark another user's notifications (403 Forbidden).

## Migration

```bash
cd backend
npm run db:migrate
```

## Test

1. Log in as post author (`demo@community.local`)
2. Have reactions or admin actions change post status
3. Open **Notifications** tab — new notification appears
4. Click **Mark as read**
5. Log in as different user — cannot see other user's notifications

## Not included

- Push notifications
- Email notifications
- WebSocket / realtime delivery

> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-11: Moderation and Rate Limiting

## What changed

User account moderation (suspend / ban / unban) was restored for Admin Review,
plus rate limiting on sensitive endpoints.

After the CoreMap auth clone, moderation was temporarily removed so this backend
would not mutate shared accounts. It is now back, intentionally writing only
`app_auth.auth_users.account_status` / `is_active` (no second user table), with
safety rules so admins cannot moderate themselves or other admin accounts.

## Account statuses (shared `app_auth.auth_users`)

| Status | Behavior |
|--------|----------|
| `active` | Full access (subject to role permissions) |
| `suspended` | Can log in and use read routes (`/auth/me`, notifications). **Cannot** create posts or reactions |
| `banned` | Cannot log in (or demo-login). Sessions revoked. Protected write routes blocked |

CoreMap-native `disabled` / `deleted` are treated like banned for login.

## Moderation flow

```
Admin → POST /admin/users/:publicId/suspend|ban|unban
  → authenticate + requireRole("admin", "super_admin")
  → update app_auth.auth_users.account_status (+ is_active on ban/unban)
```

| Route | Result |
|-------|--------|
| `GET /admin/users` | List users who posted or reacted in the community |
| `POST /admin/users/:publicId/suspend` | `account_status → suspended`, `is_active → true` |
| `POST /admin/users/:publicId/ban` | `account_status → banned`, `is_active → false`, revoke sessions |
| `POST /admin/users/:publicId/unban` | `account_status → active`, `is_active → true` |

Safety rules:

- Only `admin` / `super_admin` roles
- Cannot suspend / ban / unban yourself
- Cannot moderate another `admin` / `super_admin` account

Enforcement:

- Login / refresh / me / demo login → block banned
- Create post / react (`requireActiveAccount`) → block suspended and banned

## Admin Review UI

The Admin Review page now has two sections:

1. **User Moderation** — Suspend / Ban / Unban buttons
2. **Post Review** — Verify / Reject / Resolve / Expire (unchanged)

## Demo Mode

1. Use Demo User → create a post (so the user appears in the moderation list)
2. Use Demo Admin → Admin Review → Suspend or Ban Demo User / Demo Reactor
3. Suspended Demo User can still switch accounts / log in, but Create Post / Confirm returns 403
4. Banned Demo User cannot Use Demo User / login until Unban (or Reset Demo Data)
5. Reset Demo Data restores the three demo users to `active`

## Rate limiting purpose

Prevents abuse on high-risk endpoints by limiting requests per IP per time window:

| Endpoint | Env vars | Default |
|----------|----------|---------|
| `POST /auth/login` | `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_MS` | 10 / 60s |
| `POST /auth/register` | `RATE_LIMIT_REGISTER_MAX`, `RATE_LIMIT_REGISTER_WINDOW_MS` | 5 / 60s |
| `POST /community/posts` | `RATE_LIMIT_CREATE_POST_MAX`, `RATE_LIMIT_CREATE_POST_WINDOW_MS` | 20 / 60s |
| `POST /community/posts/:id/reactions` | `RATE_LIMIT_REACTIONS_MAX`, `RATE_LIMIT_REACTIONS_WINDOW_MS` | 30 / 60s |

When exceeded, the API returns `429 Too Many Requests`.

## Migration

No new migration. Moderation uses the existing string column
`app_auth.auth_users.account_status` and boolean `is_active`.

## Test

1. Admin bans a user → banned user cannot login / demo-login
2. Admin suspends a user → suspended user can login but cannot create post or react (403)
3. Admin unbans a user → user returns to active
4. Non-admin calling `/admin/users/...` → 403
5. Admin cannot ban themselves → 400
6. Exceed rate limit on login → 429

## Not included

- AI moderation
- Spam scoring
- Automatic permanent bans
- Advanced fraud detection
- Mutating CoreMap roles or unrelated CoreMap tables

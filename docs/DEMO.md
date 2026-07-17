# Demo Mode

Classroom / showcase helpers for walking through the product without inventing accounts by hand.

## Enable

In `backend/.env`:

```bash
DEMO_MODE=true
```

Restart the backend. Routes under `/demo/*` are registered only when this flag is true. The frontend shows the Demo toolbar after `GET /demo/status` reports enabled.

**Warning:** keep `DEMO_MODE=false` (or unset) on real production. Showcase environments may turn it on intentionally, then turn it off afterwards.

Demo Mode does **not** bypass JWT or role checks. Demo login mints real backend-signed sessions. Demo Admin still needs the `admin` role.

## Fixed demo accounts

Created idempotently in shared `app_auth.auth_users` (not a separate demo table):

| Key | Email | Role | UI label |
|-----|-------|------|----------|
| user | `demo.user@coremap.local` | `user` | Use Demo User |
| reactor | `demo.reactor@coremap.local` | `user` | Use Demo Reactor |
| admin | `demo.admin@coremap.local` | `admin` | Use Demo Admin |

A password hash is stored for schema validity, but demo login endpoints do not ask for a password — they mint a session directly.

## Important shared-DB note

Demo Mode **does write into shared CoreMap auth**:

- Ensures the three demo users and their role rows exist
- Creates refresh sessions for demo logins
- Creates community posts / reactions / notifications owned by those users

Reset is scoped carefully (see below), but claims that Demo Mode “never touches CoreMap data” are incorrect.

## One-click showcase (recommended)

With Demo Mode on and the app open:

1. **Reset Demo Data** — clean previous demo posts/reactions/notifications/sessions
2. **Run Full Demo** — creates a sample post as Demo User and adds one Confirm from Demo Reactor
3. Open **Reliable Board** — the demo post should appear under the demo-only threshold
4. **Use Demo Admin** → **Admin Review** — verify / unverify / reject / resolve / expire; try user suspend / ban / unban on a demo user
5. Switch accounts and open **Notifications** — authors see reaction and status-change alerts

## Manual script

1. Use Demo User → Create Demo Post (or create from the Create Post page)
2. Use Demo Reactor → Confirm the post on Free Board
3. Demo threshold (demo-authored posts only, while Demo Mode is on):

   - `confirm_count >= 1`
   - `trust_score >= 2`
   - `fake_count = 0`
   - → status `community_confirmed`

4. Production threshold for real posts remains **trust score ≥ 8**
5. Use Demo Admin for review and moderation actions
6. Reset Demo Data when finished

## Reset boundaries

`POST /demo/reset` (and the toolbar button):

- Deletes only posts authored by the three fixed demo emails
- Deletes reactions and notifications tied to those posts / demo users
- Deletes demo users’ sessions
- Restores the three demo users to `active` / usable
- **Never** deletes the demo user rows themselves
- **Never** truncates or drops tables
- Aborts if a collected post is not demo-owned

## API helpers

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/demo/status` | Enabled flag + demo user list |
| POST | `/demo/login/user` | Session as Demo User |
| POST | `/demo/login/reactor` | Session as Demo Reactor |
| POST | `/demo/login/admin` | Session as Demo Admin |
| POST | `/demo/create-post` | Sample post by Demo User |
| POST | `/demo/run-full` | Create post + one Confirm (no auto-admin-verify) |
| POST | `/demo/reset` | Scoped demo cleanup |

Banned demo users cannot demo-login (same ban rules as normal login).

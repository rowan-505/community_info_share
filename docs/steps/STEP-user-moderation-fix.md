# STEP: User Moderation Fix (account_status CHECK constraint)

## The error

Clicking **Suspend** or **Ban** in Admin Review failed with:

```
new row for relation "auth_users" violates check constraint "auth_users_account_status_chk"
```

## Cause

The shared CoreMap auth table `app_auth.auth_users` has a CHECK constraint on
`account_status` that allows **only**:

| Allowed value |
|---------------|
| `active` |
| `disabled` |
| `deleted` |

The moderation feature was writing `suspended` and `banned`, which the
database rejects. Because the update runs in a transaction, the whole
moderation action (status change, `is_active`, session revocation) failed.

## Fix: mapping onto valid values

We did **not** change the CoreMap constraint and did **not** add a second auth
table or duplicate status column. Instead, moderation now writes only valid
values, using `is_active` to distinguish Suspend from Ban:

| Action | `account_status` | `is_active` | Sessions |
|--------|------------------|-------------|----------|
| Suspend | `disabled` | `true` | kept |
| Ban | `disabled` | `false` | revoked |
| Unban | `active` | `true` | — |

The human intent ("suspended" vs "banned") is recorded in the existing
`admin_note` column (there is no moderation action table in this schema).

## Behavior change (important)

The old design claimed "suspended users can log in but cannot post/react".
That is no longer possible: login (and refresh / me / demo login) blocks any
account with `account_status !== "active"` or `is_active = false`, and
`disabled` is the only valid non-active status we can store. So for this MVP:

> **Suspend/Ban: account disabled. User cannot use protected features.**

The Admin Review UI text was updated to say exactly that (no lying in the UI).
The UI shows friendly labels: `Active`, `Disabled (suspended)` (is_active
true), `Disabled (banned)` (is_active false), `Deleted`.

## Why we did not change the CoreMap constraint

`app_auth.auth_users` is shared with CoreMap. Changing its CHECK constraint,
adding enum values, or creating a parallel user/status table would desync the
two systems and risk breaking CoreMap auth. Mapping onto the existing allowed
values is safe, reversible, and needs no migration.

## Code changes

| File | Change |
|------|--------|
| `backend/src/shared/account-status.ts` | `ACCOUNT_STATUS` is now `active/disabled/deleted`; `isBannedAccount`/`isSuspendedAccount` replaced by `isBlockedAccount`; added `toDisplayAccountStatus` |
| `backend/src/modules/admin-users/admin-users.service.ts` | Suspend/Ban write `disabled` (Ban also `is_active=false`); passes a `moderationLabel` for `admin_note` |
| `backend/src/modules/admin-users/admin-users.repository.ts` | `accountStatus` param typed to the valid set; list/response normalizes status to the CoreMap set |
| `backend/src/modules/admin-users/admin-users.routes.ts` | Swagger summaries match real behavior |
| `backend/src/plugins/auth.ts` | `requireActiveAccount` blocks any non-active account |
| `backend/src/modules/auth/auth.service.ts` | Login/refresh/me gate uses `isBlockedAccount` |
| `backend/src/modules/demo/demo.service.ts` | Demo login uses the same block rule |
| `frontend/src/views/AdminReview.tsx` | Honest UI note + friendly status labels |

No migration. No constraint change. Only the clicked target user is updated
(single-row `update` by `public_id` inside a transaction).

## How to test

1. Log in as admin (or Demo Admin).
2. Open **Admin Review** → User Moderation.
3. **Suspend** a normal user → no constraint error; status shows
   `Disabled (suspended)`; that user's login now returns 403.
4. **Unban** → status `Active`; login works again.
5. **Ban** → status `Disabled (banned)`; `is_active` false; sessions revoked;
   login returns 403; an existing access token gets 403 on create post/react.
6. Confirm all other users in the list are unchanged.

All six checks were run against a dev server on 2026-07-17 and passed.

## Not included

- A moderation history/audit table (only `admin_note` records the last action)
- "Soft suspend" where the user can still log in (needs a schema change on the
  shared CoreMap table, out of MVP scope)

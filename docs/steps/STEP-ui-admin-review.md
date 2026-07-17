# STEP: UI Admin Review

## Files Changed

- `frontend/src/views/AdminReview.tsx`
  - Added a cleaner Admin Review header with the requested title and subtitle.
  - Added a role indicator: `Logged in as [name] · Role: [role]`.
  - Split the page into `User Moderation` and `Post Review` sections.
  - Reworked user moderation cards with status badges, role badges, post counts, and grouped actions.
  - Reused the existing `PostCard` for post review cards and added clearer action button variants.
  - Preserved existing admin API calls, role checks, and mutation behavior.

- `frontend/src/App.css`
  - Added admin review layout, section, grid, card, badge, action, and empty-state styles.
  - Added mobile rules for stacked cards and full-width admin action buttons.

## User Moderation UI Improvements

- User cards now show:
  - display name;
  - email;
  - account status badge;
  - role badges;
  - post count;
  - `Suspend`, `Ban`, and `Unban` actions.
- Status badge behavior:
  - Active: green;
  - Disabled: amber/red depending on suspended/banned display state;
  - Deleted: gray.
- Action button behavior:
  - `Suspend`: warning/secondary style;
  - `Ban`: danger style;
  - `Unban`: success/primary style.
- Empty state now shows `No users to moderate.`

## Post Review UI Improvements

- Post Review uses the existing shared `PostCard`, so post display stays consistent with the board pages.
- Post cards show:
  - title;
  - topic badge;
  - author;
  - status badge;
  - trust score badge;
  - reaction counts;
  - grouped admin actions.
- Action buttons are styled by intent:
  - `Verify`: primary;
  - `Unverify`: secondary;
  - `Reject`: danger;
  - `Resolve`: success;
  - `Expire`: secondary.
- Empty state now shows `No posts to review.`
- Raw post status values continue to be mapped by `PostCard`, for example:
  - `community_confirmed` to `Community Confirmed`;
  - `admin_verified` to `Admin Verified`;
  - `free_board` to `Free Board`.

## Responsive Behavior

- Desktop user moderation cards use a responsive grid.
- Post review cards remain full-width for easy scanning.
- Mobile layout stacks cards vertically.
- Admin card headers stack on mobile.
- Admin action buttons wrap and become full-width on small screens.

## Boundaries

- No backend logic changed.
- No API clients changed.
- No API contracts changed.
- Admin role checks, user moderation actions, and post review actions are unchanged internally.

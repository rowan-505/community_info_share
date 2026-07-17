# STEP: UI Post Cards

## Files Changed

- `frontend/src/components/PostCard.tsx`
  - Improved the existing reusable post card instead of creating a duplicate component.
  - Added structured card sections for header, title, topic badge, author metadata, description, badges, reactions, and admin actions.
  - Added readable status labels while preserving the raw API status values.
  - Added optional `boardLabel` support for Reliable Board cards.

- `frontend/src/components/ReactionButtons.tsx`
  - Updated reactions to support both clickable and read-only display modes.
  - Added separate styling hooks for `confirm`, `useful`, `fake`, and `resolved`.
  - Kept reaction action values unchanged.

- `frontend/src/views/FreeBoard.tsx`
  - Kept existing Free Board API loading and reaction behavior unchanged.
  - Added a clean empty state card.

- `frontend/src/views/ReliableBoard.tsx`
  - Kept existing Reliable Board API loading and filtering behavior unchanged.
  - Added a clean empty state card.
  - Added the `Reliable Board` label to each rendered post card.

- `frontend/src/App.css`
  - Added post card layout, badges, status colors, trust badge, reaction controls, empty state styling, and mobile wrapping rules.

## PostCard Component Updated

- The existing `PostCard` remains the shared component for Free Board, Reliable Board, and admin post review usage.
- Each card now shows:
  - title;
  - topic badge;
  - author;
  - short description;
  - status badge;
  - trust score badge;
  - reaction counts;
  - action buttons when reactions are enabled.
- Reliable Board cards can show a small `Reliable Board` label without changing the API response.

## Status Badge Behavior

- `free_board`
  - Blue/gray info badge labeled `Free Board`.
- `community_confirmed`
  - Green badge labeled `Community Confirmed`.
- `admin_verified`
  - Blue badge labeled `Admin Verified`.
- `rejected`
  - Red badge labeled `Rejected`.
- `resolved`
  - Teal/green badge labeled `Resolved`.
- `expired`
  - Gray badge labeled `Expired`.

## Reaction Behavior

- Free Board reactions remain clickable and still call the existing reaction API flow.
- Reliable Board reactions render as read-only counts.
- Reaction visual styles:
  - `Confirm`: primary blue;
  - `Useful`: neutral secondary;
  - `Fake`: subtle danger;
  - `Resolved`: success green.

## Responsive Behavior

- Cards are full width on mobile.
- Post header stacks when space is tight.
- Topic badges can wrap instead of overflowing.
- Status/trust badges wrap cleanly.
- Reaction buttons and counts wrap into stable rows with comfortable tap targets.

## Boundaries

- No backend logic changed.
- No API clients changed.
- No API contracts changed.
- Reliable Board filtering remains controlled by the existing `getReliableBoardPosts()` API call.

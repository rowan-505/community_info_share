# STEP: UI Improvement Plan

## 1. Current UI Problems

- The app is functional but visually raw: most surfaces use browser-default-feeling borders, small spacing, and flat gray buttons.
- The page container is narrow and plain, with no distinct application shell, header band, or content rhythm.
- Navigation is implemented as generic buttons, so the main views do not read as clean tabs.
- The auth area in the header is text-heavy and visually equal to the primary navigation.
- Demo Mode is useful but too large and instructional; it competes with the main app instead of acting like a compact presenter utility.
- Post cards show metadata as paragraph text, including raw status values such as `community_confirmed`, instead of readable badges.
- Trust score is plain text rather than a scannable credibility badge.
- Reaction buttons are generic buttons with counts in parentheses; they do not feel like lightweight actions attached to a post.
- Form fields are plain and share `.create-form` between create-post and auth screens, which limits layout-specific polish.
- Admin review mixes user moderation cards with `.notification-card`, making admin and notification UI concepts blur together.
- Notification cards lack clear unread emphasis, type/status badges, and a clean read action layout.
- Empty, loading, error, and success states are basic text blocks and do not share a cohesive style.
- Responsive behavior mostly relies on flex wrapping; mobile layout is usable but not intentionally designed.

## 2. Target UI Style

- Modern, simple, class-assignment-ready interface with a calm civic/community feel.
- Centered page container with comfortable max width, generous top/bottom spacing, and a subtle page background.
- Clean top header containing the app name, signed-in state, and navigation as tab-like controls.
- Clear content sections with consistent title, description, and list spacing.
- Compact cards with 8px or smaller radius, subtle borders, light shadows only where helpful, and good text hierarchy.
- Readable status badges for post state, notification read state, account state, and roles.
- Trust score badge that can be scanned quickly without changing the underlying `trustScore` field.
- Reaction buttons styled as compact action pills with count emphasis.
- Forms with clearer labels, larger tap targets, focus states, and full-width mobile behavior.
- Admin cards that feel operational and denser than public post cards, without turning the MVP into a complex dashboard.
- No heavy UI framework; use existing React, TypeScript, and plain CSS.

## 3. Component Structure To Improve

- `App.tsx`
  - Keep state, view switching, auth flow, demo callbacks, and API usage unchanged.
  - Add layout class wrappers only if needed, such as an app shell and content container.

- `NavHeader.tsx`
  - Keep the same navigation data and callbacks.
  - Improve markup classes for brand, user summary, notification count, and tab list.
  - Present navigation buttons as tabs while preserving the current `ViewName` behavior.

- `DemoToolbar.tsx`
  - Keep demo API actions unchanged.
  - Make the panel compact with a small header row, condensed account switch buttons, and a quieter message area.
  - Reduce instructional text density while preserving necessary demo warnings.

- `PostCard.tsx`
  - Keep the `CommunityPost` prop and reaction/admin action behavior unchanged.
  - Add semantic class hooks for card header, title, topic, author, description, metadata row, status badge, and trust score badge.
  - Convert raw status display to a UI label locally while preserving the raw API value.

- `ReactionButtons.tsx`
  - Keep `ReactionType` values and `onReact(type)` unchanged.
  - Add class hooks per reaction type for cleaner styling.
  - Keep labels readable; counts should be visually separated from the action label.

- `CreatePostForm.tsx`
  - Keep submitted payload shape unchanged: `{ title, description, topic }`.
  - Add form-specific class names for field groups, labels, controls, and submit row.
  - Improve disabled and focus states through CSS.

- `AuthView.tsx`
  - Keep register/login logic and auth API calls unchanged.
  - Style the login/register toggle as segmented controls.
  - Reuse form control styling but avoid making auth depend on create-post-specific classes.

- `FreeBoard.tsx` and `ReliableBoard.tsx`
  - Keep data loading, refresh behavior, and reaction behavior unchanged.
  - Add list wrapper classes and consistent empty/loading/error presentation.
  - Keep public board copy concise and user-facing.

- `Notifications.tsx`
  - Keep notification API calls and unread count callback unchanged.
  - Add notification-specific card classes, unread badge, type badge, timestamp styling, and action row.

- `AdminReview.tsx`
  - Keep role checks, admin post actions, user moderation actions, and API calls unchanged.
  - Split visual classes for user moderation cards and post review sections.
  - Add account status badges, role chips, and clearer admin action button styles.

## 4. CSS Structure Recommendation

- Continue using `frontend/src/App.css` and `frontend/src/index.css`; do not add a UI framework.
- Use `index.css` for global reset, body background, font smoothing, base text color, and CSS custom properties.
- Use `App.css` for app shell, header, tabs, cards, badges, forms, notifications, demo toolbar, admin sections, and responsive rules.
- Introduce a small token set in `:root`, for example:
  - color tokens for background, surface, border, muted text, primary, success, warning, danger, and info;
  - spacing tokens for common gaps;
  - shadow and radius tokens.
- Prefer reusable utility-like component classes only where they map to existing UI concepts:
  - `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`;
  - `.badge`, `.badge-status-*`, `.trust-badge`;
  - `.form-field`, `.form-control`;
  - `.card`, `.post-card`, `.notification-card`, `.admin-card`.
- Avoid one-off color declarations scattered throughout components.
- Keep border radius at 8px or less.
- Do not introduce CSS modules, Tailwind, Bootstrap, Material UI, or a component library for this MVP.

## 5. Responsive Behavior Plan

- Use a centered `.app` container with responsive width, such as `width: min(100% - 2rem, 960px)`.
- On desktop:
  - header top row shows brand and auth status side by side;
  - tabs wrap cleanly if needed;
  - cards use horizontal metadata/action rows.
- On tablet:
  - maintain the centered container;
  - allow navigation tabs and demo actions to wrap with consistent gaps.
- On mobile:
  - reduce page padding;
  - stack header brand/auth content vertically;
  - make navigation tabs horizontally scrollable or wrap into two rows with stable tap targets;
  - make forms full width;
  - stack post metadata, reaction buttons, admin actions, and notification actions;
  - prevent long emails/status text from overflowing with `overflow-wrap: anywhere` on metadata fields.
- Ensure all buttons have at least comfortable mobile tap size and visible focus states.

## 6. Which Files Should Change

- `frontend/src/index.css`
  - Add global base styles, body background, and CSS variables.

- `frontend/src/App.css`
  - Replace raw MVP styling with structured app shell, header, tabs, cards, badges, forms, admin, demo, notifications, and responsive rules.

- `frontend/src/App.tsx`
  - Optional small class wrapper changes only; no state or API behavior changes.

- `frontend/src/components/NavHeader.tsx`
  - Add semantic class names and notification badge markup.

- `frontend/src/components/DemoToolbar.tsx`
  - Add compact layout class names and cleaner message/action structure.

- `frontend/src/components/PostCard.tsx`
  - Add status label/badge rendering, trust score badge, and structured card markup.

- `frontend/src/components/ReactionButtons.tsx`
  - Add reaction button class names and count span markup.

- `frontend/src/components/CreatePostForm.tsx`
  - Add form field/control class names.

- `frontend/src/views/AuthView.tsx`
  - Add auth-specific wrapper/toggle classes while keeping submit behavior unchanged.

- `frontend/src/views/FreeBoard.tsx`
  - Add board/list/empty state class names.

- `frontend/src/views/ReliableBoard.tsx`
  - Add board/list/empty state class names.

- `frontend/src/views/CreatePost.tsx`
  - Add create view class hooks if needed.

- `frontend/src/views/Notifications.tsx`
  - Add notification card structure, badges, and action row classes.

- `frontend/src/views/AdminReview.tsx`
  - Add admin section/card/status/role/action classes.

## 7. Which Files Must Not Change

- Backend source files under `backend/`.
- Database schema and migrations under `backend/prisma/`.
- API route contracts, request payloads, and response payloads.
- `frontend/src/api/client.ts`.
- `frontend/src/api/communityPostsApi.ts`.
- `frontend/src/api/authApi.ts`.
- `frontend/src/api/notificationsApi.ts`.
- `frontend/src/api/adminReviewApi.ts`.
- `frontend/src/api/adminUsersApi.ts`.
- `frontend/src/api/demoApi.ts`.
- `frontend/src/auth/tokenStorage.ts`.
- `frontend/src/types/post.ts`, unless only adding UI-only helper types becomes necessary; prefer not to change it.
- `frontend/src/types/auth.ts`.
- Package files, unless a later explicit request allows dependency changes.

## 8. Safe Implementation Order

1. Add CSS variables and global base styling in `index.css`.
2. Rework `App.css` foundation: app container, main spacing, messages, base buttons, badges, and forms.
3. Update `NavHeader.tsx` classes and style navigation as tabs.
4. Update `PostCard.tsx` and `ReactionButtons.tsx` markup classes for cards, badges, trust score, and reactions.
5. Update board views with list and empty-state wrappers.
6. Update `CreatePostForm.tsx`, `CreatePost.tsx`, and `AuthView.tsx` for better form layout and auth toggle styling.
7. Compact `DemoToolbar.tsx` without changing any demo actions.
8. Update `Notifications.tsx` card structure and unread/read presentation.
9. Update `AdminReview.tsx` admin user cards, role chips, status badges, and action layouts.
10. Run frontend checks with `npm run build` from `frontend/`.
11. Manually verify desktop and mobile widths for header wrapping, card readability, forms, demo toolbar, notifications, and admin review.

## Warnings

- Keep all API client calls and endpoint paths exactly as they are.
- Do not rename `ViewName`, `CommunityPost`, `PostReactions`, auth payloads, notification fields, or admin action names.
- Do not change demo reset confirmation behavior or demo data actions.
- Do not hide admin actions based on UI-only assumptions; preserve existing role checks.
- Avoid adding icons unless an icon library is already introduced by a separate approved task.
- The repository already contains unrelated modified and deleted files; implementation should avoid touching them.

# STEP: UI Notifications

## Files Changed

- `frontend/src/views/Notifications.tsx`
  - Added a cleaner page header with the requested title and subtitle.
  - Added unread count badge.
  - Added account-specific demo helper text.
  - Reworked notification cards to show message, type badge, reaction badge, created time, read/unread state, and mark-as-read action.
  - Preserved existing notification loading and mark-as-read behavior.

- `frontend/src/App.css`
  - Added notification header, helper, card, unread/read, badge, action, and empty-state styles.
  - Added responsive rules for mobile card/action wrapping.

## Notification UI Improvements

- Page title remains `Notifications`.
- Subtitle is now `In-app updates for your posts and review activity.`
- Unread count appears as `Unread: X` in a badge.
- Demo helper text says:
  - `Notifications are account-specific. Switch to Demo User to see notifications for uploaded posts.`
- Notification cards now show:
  - title;
  - message;
  - type badge;
  - reaction type badge when present;
  - relative created time;
  - read/unread badge;
  - optional `Mark as read` button.
- Empty state now shows:
  - `No notifications yet`
  - `React to a post or verify a post to create notifications.`

## Unread And Read Behavior

- Unread notifications have a subtle highlighted background/border and an unread dot.
- Read notifications use the normal card style.
- `Mark as read` still calls the existing `notificationsApi.markAsRead(publicId)` flow.
- Unread count still updates through the existing `onUnreadCountChange` callback.

## Responsive Behavior

- Notification cards remain full width.
- Header content stacks on mobile.
- Badges wrap cleanly.
- Notification actions wrap and become full-width on small screens.

## Boundaries

- No backend logic changed.
- No API clients changed.
- No API contracts changed.

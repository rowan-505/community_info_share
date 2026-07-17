# STEP: UI Global Style

## CSS Files Changed

- `frontend/src/index.css`
  - Added global design tokens with CSS custom properties.
  - Added base page background, typography, box sizing, form control inheritance, and visible focus states.

- `frontend/src/App.css`
  - Replaced the raw MVP stylesheet with a reusable UI foundation.
  - Added app shell, responsive container, header, navigation tabs, cards, buttons, badges, forms, alerts, empty states, demo toolbar, notification cards, and layout helpers.
  - Preserved existing class names such as `.app`, `.btn`, `.post-card`, `.create-form`, `.error-message`, `.demo-toolbar`, and `.notification-card` so components keep working without backend or API changes.

- `frontend/src/App.tsx`
  - Added `app-shell` and `app-container` classes to the existing root app wrapper.
  - No state, backend logic, or API contract behavior was changed.

## Design Tokens Added

- Colors:
  - page background: `--color-bg`
  - card surface: `--color-surface`
  - muted surface: `--color-surface-muted`
  - soft borders: `--color-border`, `--color-border-strong`
  - text: `--color-text`, `--color-muted`
  - primary blue: `--color-primary`, `--color-primary-dark`, `--color-primary-soft`
  - danger red: `--color-danger`, `--color-danger-dark`, `--color-danger-soft`
  - success green: `--color-success`, `--color-success-soft`
  - warning amber: `--color-warning`, `--color-warning-soft`
  - info blue: `--color-info`, `--color-info-soft`

- Spacing:
  - `--space-1` through `--space-10` for consistent gaps, padding, and layout rhythm.

- Radius:
  - `--radius-sm`, `--radius-md`, `--radius-lg`
  - Radius is capped at 8px for primary cards and controls.

- Shadows:
  - `--shadow-sm`
  - `--shadow-md`

- Font sizes:
  - `--font-xs`, `--font-sm`, `--font-md`, `--font-lg`, `--font-xl`, `--font-2xl`

- Layout:
  - `--container-max: 1100px`
  - `--focus-ring` for accessible keyboard focus styling.

## Reusable Classes Added

- Shell and layout:
  - `.app-shell`
  - `.app-container`
  - `.stack`
  - `.grid`

- Header and navigation:
  - `.app-header`
  - `.app-title`
  - `.app-subtitle`
  - `.nav-tabs`
  - `.nav-tab`

- Cards:
  - `.card`
  - `.card-header`
  - `.card-title`
  - `.card-meta`

- Buttons:
  - `.button`
  - `.button-primary`
  - `.button-secondary`
  - `.button-danger`
  - `.button-ghost`

- Badges:
  - `.badge`
  - `.badge-status`
  - `.badge-success`
  - `.badge-warning`
  - `.badge-danger`

- Forms:
  - `.form`
  - `.form-group`
  - `.input`
  - `.textarea`

- Feedback states:
  - `.alert`
  - `.alert-error`
  - `.alert-success`
  - `.empty-state`

## Responsive Behavior

- Desktop:
  - Centered content with `--container-max` around 1100px.
  - Header, cards, metadata rows, buttons, and form areas use comfortable spacing.

- Tablet:
  - Page padding tightens while keeping the centered container.
  - Cards and header keep readable padding without feeling oversized.

- Mobile:
  - Page padding reduces for small screens.
  - Header content stacks vertically.
  - Navigation buttons wrap cleanly and remain large enough to tap.
  - Forms become full width.
  - Cards remain full width.
  - Reaction, admin, and demo toolbar buttons wrap into stable rows.
  - Metadata stacks vertically to prevent overflow from long emails or status text.

## How Components Should Use Classes

- Use `.app-shell` and `.app-container` for the page frame.
- Use `.app-header`, `.app-title`, `.app-subtitle`, `.nav-tabs`, and `.nav-tab` for top-level navigation areas.
- Use `.card`, `.card-header`, `.card-title`, and `.card-meta` for new card-like UI.
- Use `.button` plus one variant class for new buttons:
  - `.button-primary` for main actions;
  - `.button-secondary` for neutral actions;
  - `.button-danger` for destructive or risky actions;
  - `.button-ghost` for low-emphasis actions.
- Use `.badge` plus a semantic variant for compact status indicators.
- Use `.form`, `.form-group`, `.input`, and `.textarea` for new form layouts.
- Existing component classes are still supported, so future UI improvements can be incremental instead of rewriting the app at once.

## Boundaries

- No backend logic changed.
- No API clients changed.
- No API contracts changed.
- No large UI library added.

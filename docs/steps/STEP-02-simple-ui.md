> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-02: Simple UI

## What was created

A minimal frontend MVP with four views and local mock data. No backend connection.

## Pages (views)

| View | File | Purpose |
|------|------|---------|
| Free Board | `frontend/src/views/FreeBoard.tsx` | Shows all posts with reaction buttons |
| Reliable Board | `frontend/src/views/ReliableBoard.tsx` | Shows posts with `community_confirmed` or `admin_verified` status |
| Create Post | `frontend/src/views/CreatePost.tsx` | Form to add a new post |
| Admin Review | `frontend/src/views/AdminReview.tsx` | Admin actions on all posts |

Navigation is handled by `NavHeader` with tab-style buttons. View switching uses React state in `App.tsx` (no router).

## Components

| Component | File | Purpose |
|-----------|------|---------|
| PostCard | `frontend/src/components/PostCard.tsx` | Displays post fields; optional reactions and admin actions |
| ReactionButtons | `frontend/src/components/ReactionButtons.tsx` | Confirm, Useful, Fake, Resolved buttons |
| CreatePostForm | `frontend/src/components/CreatePostForm.tsx` | Title, description, topic form |
| NavHeader | `frontend/src/components/NavHeader.tsx` | Top navigation between views |

## Mock data

- Initial posts live in `frontend/src/data/mockPosts.ts`.
- All state is held in `App.tsx` via `useState`.
- Creating a post, reacting, and admin actions update local state only.
- Refreshing the page resets all data to the initial mock set.

## Current user flow

1. **Browse** — Open Free Board to see all posts.
2. **React** — Click Confirm / Useful / Fake / Resolved to update counts and status locally.
3. **Filter** — Reliable Board shows only community- or admin-verified posts.
4. **Create** — Submit a new post; it appears on Free Board with `pending` status.
5. **Admin** — Use Verify / Reject / Resolve / Expire to change post status locally.

## What is still fake / mock

- No API calls or backend integration
- No authentication (author is hardcoded as `current_user` for new posts)
- Trust score and status changes are simplified local rules, not real algorithms
- Data does not persist across page refresh
- No validation library (Zod) yet

## How to run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

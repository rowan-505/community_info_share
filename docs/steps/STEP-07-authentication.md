> **Learning note:** This step shows one stage of the project. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-07: Authentication

## What changed

Simple JWT authentication was added. Users can register and log in. Creating community posts requires authentication. Post author is always the logged-in user.

## Registration flow

```
POST /auth/register { email, password, displayName }
  → validate with Zod
  → hash password (bcrypt)
  → save User in PostgreSQL
  → sign JWT with user publicId
  → return { token, user } (no passwordHash)
```

## Login flow

```
POST /auth/login { email, password }
  → find user by email
  → compare password with bcrypt
  → sign JWT
  → return { token, user }
```

## JWT flow

1. Client receives JWT after register/login.
2. Token is stored in `localStorage` (MVP only).
3. Protected requests send `Authorization: Bearer <token>`.
4. Backend `@fastify/jwt` verifies the token.
5. Payload `{ sub: userPublicId }` identifies the user.

## Protected route flow

```
POST /community/posts
  → authenticate middleware (jwtVerify)
  → if invalid/missing → 401
  → read sub from JWT
  → create post with authorId from authenticated user
```

Public routes (no token required):
- `GET /community/posts/free-board`
- `GET /community/posts/reliable-board`
- `GET /community/posts/:publicId`

Protected routes:
- `POST /community/posts`
- `GET /auth/me`

## How post author is decided

- The frontend never sends `authorId` or `authorName` when creating a post.
- The backend reads `sub` (user `publicId`) from the JWT.
- The repository looks up the user and sets `authorId` on the new post.
- `authorName` in API responses comes from the user's `displayName`.

## Environment variables

Backend `backend/.env`:

```
JWT_SECRET=your-long-random-secret
DATABASE_URL=postgresql://...
```

## Test commands

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret12","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret12"}'

# Me (replace TOKEN)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN"

# Create post (replace TOKEN)
curl -X POST http://localhost:3000/community/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"My post","description":"Hello","topic":"General"}'
```

## Frontend

- Login/Register view at **Login** tab in header
- Token stored in `localStorage`
- Header shows logged-in user and Logout button
- Create Post requires login

## Not included at Step 7

- Refresh tokens
- Email verification
- Password reset

**Added later:** Role-based admin protection in STEP-09 and STEP-11.

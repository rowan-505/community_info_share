# Documentation Guide

Use these documents to learn and present the project.

## Start here

| Document | Purpose |
|----------|---------|
| [FINAL-PROJECT-OVERVIEW.md](./FINAL-PROJECT-OVERVIEW.md) | Full MVP explanation for class presentation |
| [SUMMARY.md](./SUMMARY.md) | Step-by-step project history |

## Step guides (build order)

Each step doc shows what was added at that stage. Read them in order to understand how the project grew.

| Step | Title | Main files to study |
|------|-------|---------------------|
| [STEP-01](./steps/STEP-01-project-setup.md) | Project setup | `README.md`, folder structure |
| [STEP-02](./steps/STEP-02-simple-ui.md) | Simple UI | `frontend/src/views/`, `components/` |
| [STEP-03](./steps/STEP-03-fastify-backend.md) | Fastify backend | `backend/src/app.ts`, `modules/health/` |
| [STEP-04](./steps/STEP-04-community-api-mock.md) | Community API (mock) | `modules/community-posts/` |
| [STEP-05](./steps/STEP-05-connect-ui-api.md) | Connect UI to API | `frontend/src/api/communityPostsApi.ts` |
| [STEP-06](./steps/STEP-06-database-prisma.md) | Database + Prisma | `backend/prisma/schema.prisma` |
| [STEP-07](./steps/STEP-07-authentication.md) | JWT auth | `backend/src/plugins/auth.ts`, `modules/auth/` |
| [STEP-08](./steps/STEP-08-reactions-trust-score.md) | Reactions + trust | `community-posts.trust.ts` |
| [STEP-09](./steps/STEP-09-admin-review.md) | Admin review | `modules/admin-review/` |
| [STEP-10](./steps/STEP-10-notifications.md) | Notifications | `modules/notifications/` |
| [STEP-11](./steps/STEP-11-moderation-rate-limit.md) | Moderation + limits | `modules/admin-users/`, rate limit config |
| [STEP-12](./steps/STEP-12-swagger.md) | Swagger docs | `backend/src/plugins/swagger.ts` |
| [STEP-13](./steps/STEP-13-docker.md) | Docker | `docker-compose.yml`, `backend/Dockerfile` |
| [STEP-14](./steps/STEP-14-github-actions.md) | GitHub Actions CI | `.github/workflows/ci.yml` |

## Important note about step docs

Steps 1–8 describe **early stages**. Some details changed in later steps (for example: mock data became real database, admin review was connected to API). Always check [FINAL-PROJECT-OVERVIEW.md](./FINAL-PROJECT-OVERVIEW.md) for the current full picture.

## Quick learning path for students

1. Read **FINAL-PROJECT-OVERVIEW.md** (30 minutes).
2. Run the project locally (see overview → How to run).
3. Open Swagger at `http://localhost:3000/docs` and try endpoints.
4. Read STEP-03, STEP-06, STEP-07, STEP-08 for core backend ideas.
5. Read STEP-05 and frontend `api/` folder for frontend ↔ backend flow.

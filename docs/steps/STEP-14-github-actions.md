> **Learning note:** This document explains the repository as it exists now. For the full MVP, see [FINAL-PROJECT-OVERVIEW.md](../FINAL-PROJECT-OVERVIEW.md).

# STEP-14: GitHub Actions CI and Deployment Status

## Current status

The repository contains one GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

It performs **Continuous Integration (CI)** only:

- installs backend dependencies;
- generates Prisma Client;
- compiles backend TypeScript;
- runs backend tests if a test script is added later;
- installs frontend dependencies;
- compiles TypeScript and builds the Vite frontend;
- runs frontend tests if a test script is added later.

It currently does **not**:

- build the Docker image;
- publish an image;
- migrate a remote database;
- deploy the backend;
- deploy the frontend;
- promote or roll back a release.

Therefore, the project has CI but no Continuous Deployment (CD).

## CI, delivery, and deployment

| Term | Meaning |
|------|---------|
| CI | Automatically validate every change |
| Continuous Delivery | Produce a release artifact that is ready for a manual production promotion |
| Continuous Deployment | Automatically release every accepted change to production |

The current repository implements only the first row.

## When the workflow runs

The workflow contains:

```yaml
on:
  push:
  pull_request:
```

This means:

- every pushed branch starts CI;
- opening or updating a pull request starts CI;
- pushing more commits while a previous run is active may create another run;
- there are currently no branch filters;
- there is no scheduled or manual `workflow_dispatch` trigger.

Runs are visible in the GitHub repository under **Actions → CI**.

## How the workflow executes

GitHub creates a temporary `ubuntu-latest` runner for each run. The runner starts empty and is destroyed afterwards.

### 1. Checkout

```yaml
uses: actions/checkout@v4
```

Downloads the commit being checked into the runner.

### 2. Node.js setup and npm cache

```yaml
uses: actions/setup-node@v4
with:
  node-version: 22
  cache: npm
  cache-dependency-path: |
    backend/package-lock.json
    frontend/package-lock.json
```

This installs Node.js 22 and caches downloaded npm package data based on both lockfiles. It does not cache `node_modules`.

### 3. Backend dependency installation

```yaml
working-directory: backend
run: npm ci
```

`npm ci`:

- uses the exact versions in `package-lock.json`;
- removes an existing `node_modules` directory on the runner;
- fails if `package.json` and `package-lock.json` disagree;
- is more reproducible than `npm install` for CI.

### 4. Prisma generation

```yaml
run: npm run db:generate
```

Generates Prisma Client from `backend/prisma/schema.prisma`.

This does not connect to PostgreSQL, apply migrations, or inspect real data.

### 5. Backend compilation

```yaml
run: npx tsc
```

Compiles backend TypeScript into `backend/dist`. This catches invalid imports and type errors.

It does not start Fastify or test API/database behavior.

### 6. Optional backend tests

```yaml
run: npm run test --if-present
```

The current backend has no `test` script, so this step succeeds without running tests. It is a placeholder, not proof that backend behavior was tested.

### 7. Frontend installation and build

The workflow runs:

```bash
cd frontend
npm ci
npm run build
```

`npm run build` executes:

```text
tsc -b → vite build
```

This type-checks the React app and creates optimized static files in `frontend/dist`.

The current workflow does not separately run `npm run lint`, so oxlint is not part of CI yet.

### 8. Optional frontend tests

The frontend also has no `test` script. `npm run test --if-present` is currently skipped.

## Why no database secret is needed for CI

The workflow only generates Prisma Client and compiles code. It does not start the API or run migrations.

This is safer because pull-request code never receives production database credentials.

Do not add the Supabase `DATABASE_URL` or `JWT_SECRET` to a pull-request build unless a trusted integration-test design explicitly requires them.

## Start GitHub Actions step by step

The current local directory was not initialized as a Git repository when this document was updated. GitHub Actions cannot run until the project is pushed to GitHub.

### 1. Inspect ignored secrets

The root `.gitignore` must ignore `.env` files and build/dependency output. Open it and confirm these patterns exist before initializing the repository.

Never commit:

- `backend/.env`;
- `frontend/.env`;
- Supabase credentials;
- `JWT_SECRET`;
- generated `node_modules`;
- generated `dist`.

### 2. Initialize Git and verify ignores

From the project root:

```bash
git init
git branch -M main
git check-ignore backend/.env frontend/.env
git status
```

Both environment paths should be reported by `git check-ignore`. Review the complete untracked-file list before staging.

### 3. Run the CI checks locally

```bash
# Backend
cd backend
npm ci
npm run db:generate
npx tsc
npm run test --if-present

# Frontend
cd ../frontend
npm ci
npm run lint
npm run build
npm run test --if-present

cd ..
```

The local sequence includes frontend lint even though the current workflow does not.

### 4. Create the first commit

```bash
git add .
git status
git commit -m "Set up Community Info MVP"
```

Inspect `git status` before committing and confirm no secret file is staged.

### 5. Create an empty GitHub repository

On GitHub:

1. Click **New repository**.
2. Choose the owner and repository name.
3. Do not initialize it with another README, `.gitignore`, or license if the local project already contains them.
4. Create the repository.

### 6. Connect and push

Use the remote URL shown by GitHub:

```bash
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

The push triggers `.github/workflows/ci.yml`.

### 7. Inspect the run

1. Open the repository on GitHub.
2. Select **Actions**.
3. Open the **CI** workflow.
4. Open the newest run.
5. Expand a failed step to inspect its logs.

### 8. Protect the main branch

After the first successful run:

1. Open **Settings → Branches** (or Rulesets).
2. Create a rule for `main`.
3. Require a pull request before merging.
4. Require the `ci` status check.
5. Optionally require the branch to be up to date.

This prevents merging code that does not compile.

## Recommended day-to-day Git workflow

```bash
git switch -c feature/my-change

# edit and verify
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

Then open a pull request into `main`. GitHub runs CI for both the branch push and the pull request because the current workflow listens to both events.

## Current deployment setup

There is no deployment configuration in this repository.

`backend/Dockerfile` is a packaging mechanism, not a deployment. `frontend/dist` is a build artifact, not a hosted website.

A complete deployment needs two independently hosted parts:

```text
Browser
  → deployed React static site
  → deployed Fastify HTTPS API
  → shared Supabase/PostgreSQL
```

### Backend deployment requirements

A container hosting platform must:

1. Build `backend/Dockerfile` or pull a published image.
2. expose the API over HTTPS;
3. route traffic to container port `3000`;
4. set `NODE_ENV=production`;
5. set `DEMO_MODE=false`;
6. provide `DATABASE_URL`, `JWT_SECRET`, and allowed CORS origins as secrets/configuration;
7. run a health check against `/health`;
8. run committed Prisma migrations deliberately using `npm run db:migrate:deploy`.

### Frontend deployment requirements

A static hosting platform must:

1. run `npm ci`;
2. run `npm run build` in `frontend/`;
3. publish `frontend/dist`;
4. set `VITE_API_BASE_URL` to the deployed HTTPS API URL at build time.

Vite variables are compiled into browser files. `VITE_API_BASE_URL` is public configuration, not a secret.

### CORS

The backend must allow the deployed frontend origin. Configure:

```env
CORS_ORIGIN=https://your-frontend.example
```

Do not leave production CORS open to arbitrary origins.

### Production database migration sequence

A safe release sequence is:

```text
1. CI passes
2. Build an immutable backend image
3. Back up / verify the database
4. Run npm run db:migrate:deploy once
5. Deploy the backend image
6. Verify /health and API logs
7. Deploy the frontend with the final API URL
8. Run a smoke test
```

Never use these against the shared production database:

```text
prisma migrate reset
prisma db push --force-reset
DROP SCHEMA
TRUNCATE
```

## What a future deployment workflow would add

A future CD workflow could run only after CI succeeds on `main`:

```text
CI success on main
  → build backend image
  → tag with commit SHA
  → push to registry
  → deploy/promote image
  → run health check
```

Deployment secrets would be stored under **GitHub Settings → Secrets and variables → Actions**, never in YAML or source files.

Do not add automatic production migrations to pull-request workflows. Database changes should run only from a trusted protected environment with explicit approval.

## Current gaps and recommended next improvements

1. Add `npm run lint` to frontend CI.
2. Add backend and frontend tests (current test steps are placeholders).
3. Add a Docker image build check that does not publish.
4. Choose hosting platforms for the backend and frontend.
5. Add environment-specific deployment configuration.
6. Add a protected, manually approved production deployment workflow.
7. Add post-deploy health and smoke checks.

## Troubleshooting

### Workflow does not appear

Confirm:

- `.github/workflows/ci.yml` was committed and pushed;
- GitHub Actions is enabled in repository settings;
- the YAML is on the pushed branch.

### `npm ci` fails

Run `npm install` in the affected package locally to synchronize the lockfile, then review and commit the lockfile change.

### TypeScript build fails only in CI

Check filename casing and uncommitted generated/type files. Linux paths are case-sensitive even when the local macOS filesystem is not.

### CI passes but the application fails at runtime

This is possible because CI currently has no database-backed API tests and does not start Fastify. Inspect deployment environment variables, migrations, database connectivity, and logs.

### No deployment happens after CI

That is expected. The repository currently has no deployment workflow.

-- Baseline migration for the Community app.
-- Safe on the shared CoreMap Supabase database: additive only, idempotent, and
-- scoped entirely to the dedicated "community" schema. It never touches, drops,
-- or resets any existing schema/table (public, app_auth, feedback, core,
-- transport, routing, search, ...).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "community";

-- CreateEnum (idempotent: CREATE TYPE has no IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "community"."user_role" AS ENUM ('user', 'admin', 'validator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "community"."user_status" AS ENUM ('active', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "community"."post_status" AS ENUM ('free_board', 'community_confirmed', 'admin_verified', 'rejected', 'resolved', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "community"."reaction_type" AS ENUM ('confirm', 'useful', 'fake', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "community"."notification_type" AS ENUM ('community_confirmed', 'admin_verified', 'rejected', 'resolved', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "community"."users" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "community"."user_role" NOT NULL DEFAULT 'user',
    "status" "community"."user_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "community"."community_posts" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "author_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "community"."post_status" NOT NULL DEFAULT 'free_board',
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "community"."notifications" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "community"."notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_post_id" BIGINT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "community"."post_reactions" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "reaction_type" "community"."reaction_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_public_id_key" ON "community"."users"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "community"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_posts_public_id_key" ON "community"."community_posts"("public_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_posts_author_id_idx" ON "community"."community_posts"("author_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_posts_status_idx" ON "community"."community_posts"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_public_id_key" ON "community"."notifications"("public_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "community"."notifications"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "community"."notifications"("is_read");

-- CreateIndex (index the foreign key column to keep JOINs and ON DELETE SET NULL fast)
CREATE INDEX IF NOT EXISTS "notifications_related_post_id_idx" ON "community"."notifications"("related_post_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "post_reactions_post_id_idx" ON "community"."post_reactions"("post_id");

-- CreateIndex (index the foreign key column to keep JOINs and ON DELETE CASCADE fast)
CREATE INDEX IF NOT EXISTS "post_reactions_user_id_idx" ON "community"."post_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "post_reactions_post_id_user_id_key" ON "community"."post_reactions"("post_id", "user_id");

-- AddForeignKey (idempotent via duplicate_object guard)
DO $$ BEGIN
  ALTER TABLE "community"."community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "community"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "community"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "community"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "community"."notifications" ADD CONSTRAINT "notifications_related_post_id_fkey" FOREIGN KEY ("related_post_id") REFERENCES "community"."community_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "community"."post_reactions" ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community"."community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "community"."post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "community"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RowLevelSecurity: defense-in-depth.
-- `community` is a private schema (not exposed to the Supabase Data API), and the
-- backend accesses it via Prisma as the table owner, which bypasses RLS. RLS is
-- ENABLED (not FORCED) so that IF the schema is ever exposed to the Data API, the
-- anon/authenticated roles get zero rows by default (no policies = no access),
-- while the owner/backend keeps full access. ENABLE is idempotent.
ALTER TABLE "community"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community"."community_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community"."post_reactions" ENABLE ROW LEVEL SECURITY;

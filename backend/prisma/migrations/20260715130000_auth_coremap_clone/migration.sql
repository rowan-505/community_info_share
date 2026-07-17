-- CoreMap auth clone migration.
-- Repoints the Community schema's user foreign keys from the local, duplicate
-- "community"."users" table onto the shared CoreMap "app_auth"."auth_users"
-- table, then drops the now-unused duplicate user table + enums.
--
-- SAFETY: Scoped entirely to the "community" schema. It references app_auth as
-- an FK target only; it never creates, alters, or drops anything in app_auth or
-- any other CoreMap schema. Idempotent and guarded. The community tables are
-- empty at migration time, so repointing loses no data.

-- 1. Drop the foreign keys that reference the local "community"."users" table.
DO $$ BEGIN
  ALTER TABLE "community"."community_posts" DROP CONSTRAINT IF EXISTS "community_posts_author_id_fkey";
END $$;

DO $$ BEGIN
  ALTER TABLE "community"."notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
END $$;

DO $$ BEGIN
  ALTER TABLE "community"."post_reactions" DROP CONSTRAINT IF EXISTS "post_reactions_user_id_fkey";
END $$;

-- 2. Repoint the foreign keys onto the shared CoreMap auth users table.
DO $$ BEGIN
  ALTER TABLE "community"."community_posts"
    ADD CONSTRAINT "community_posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "app_auth"."auth_users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "community"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_auth"."auth_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "community"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_auth"."auth_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Drop the duplicate local user table (empty) now that nothing references it.
DROP TABLE IF EXISTS "community"."users";

-- 4. Drop the now-unused community-owned auth enums.
DROP TYPE IF EXISTS "community"."user_role";
DROP TYPE IF EXISTS "community"."user_status";

-- Reaction notifications migration.
-- Additive only, idempotent, and scoped to the "community" schema. Adds the
-- 'post_reaction' notification type plus nullable actor + reaction columns to
-- community.notifications. It never drops, truncates, or resets anything, and
-- references app_auth only as a foreign-key target (never alters it).

-- 1. Add the new notification type value (additive, idempotent). Not used in
--    this same migration, so it is transaction-safe on PostgreSQL 12+.
ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_reaction';

-- 2. Add nullable actor + reaction columns to notifications.
ALTER TABLE "community"."notifications"
  ADD COLUMN IF NOT EXISTS "actor_user_id" BIGINT;

ALTER TABLE "community"."notifications"
  ADD COLUMN IF NOT EXISTS "reaction_type" "community"."reaction_type";

-- 3. Foreign key: notifications.actor_user_id -> app_auth.auth_users(id).
--    ON DELETE SET NULL keeps the notification if the actor is ever removed.
DO $$ BEGIN
  ALTER TABLE "community"."notifications"
    ADD CONSTRAINT "notifications_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "app_auth"."auth_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Index the new foreign-key column.
CREATE INDEX IF NOT EXISTS "notifications_actor_user_id_idx" ON "community"."notifications"("actor_user_id");

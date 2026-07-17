-- Admin unverify + preferred notification types.
-- Additive only and scoped to the "community" schema. Adds six notification
-- enum values used by uploader notifications. Never drops, truncates, or
-- resets anything, and never alters app_auth.

ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_community_confirmed';
ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_admin_verified';
ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_admin_unverified';
ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_rejected';
ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_resolved';
ALTER TYPE "community"."notification_type" ADD VALUE IF NOT EXISTS 'post_expired';

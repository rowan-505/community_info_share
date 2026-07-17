import type { NotificationType, PostStatus, ReactionType } from "@prisma/client";

export interface NotificationActor {
  publicId: string;
  displayName: string;
}

export interface NotificationRelatedPost {
  publicId: string;
  title: string;
}

export interface NotificationItem {
  id: string;
  publicId: string;
  type: NotificationType;
  reactionType: ReactionType | null;
  title: string;
  message: string;
  relatedPostPublicId: string | null;
  actor: NotificationActor | null;
  relatedPost: NotificationRelatedPost | null;
  isRead: boolean;
  createdAt: string;
}

/** Preferred notification types written by new status/admin flows. */
export type StatusNotificationType =
  | "post_community_confirmed"
  | "post_admin_verified"
  | "post_admin_unverified"
  | "post_rejected"
  | "post_resolved"
  | "post_expired";

/**
 * Map a status transition to a notification type. Returns null when the
 * transition should not notify (same status, or a non-notifiable status).
 *
 * Unverify (`admin_verified` -> `community_confirmed`) is distinct from
 * auto-promotion (`free_board` -> `community_confirmed`).
 */
export function resolveStatusNotificationType(
  previousStatus: PostStatus,
  newStatus: PostStatus,
): StatusNotificationType | null {
  if (previousStatus === newStatus) {
    return null;
  }

  if (newStatus === "community_confirmed") {
    if (previousStatus === "admin_verified") {
      return "post_admin_unverified";
    }
    return "post_community_confirmed";
  }

  switch (newStatus) {
    case "admin_verified":
      return "post_admin_verified";
    case "rejected":
      return "post_rejected";
    case "resolved":
      return "post_resolved";
    case "expired":
      return "post_expired";
    default:
      return null;
  }
}

export function isNotifiableStatusChange(
  previousStatus: PostStatus,
  newStatus: PostStatus,
): boolean {
  return resolveStatusNotificationType(previousStatus, newStatus) !== null;
}

export function notificationContent(
  type: StatusNotificationType,
  postTitle: string,
): { title: string; message: string } {
  switch (type) {
    case "post_community_confirmed":
      return {
        title: "Post community confirmed",
        message: `Your post '${postTitle}' became Community Confirmed`,
      };
    case "post_admin_verified":
      return {
        title: "Post verified",
        message: `Admin verified your post "${postTitle}"`,
      };
    case "post_admin_unverified":
      return {
        title: "Verification removed",
        message: `Admin removed verification from your post '${postTitle}'`,
      };
    case "post_rejected":
      return {
        title: "Post rejected",
        message: `Admin rejected your post "${postTitle}"`,
      };
    case "post_resolved":
      return {
        title: "Post resolved",
        message: `Admin resolved your post "${postTitle}"`,
      };
    case "post_expired":
      return {
        title: "Post expired",
        message: `Admin expired your post "${postTitle}"`,
      };
  }
}

/** Phrase builders per reaction type. */
const REACTION_MESSAGES: Record<
  ReactionType,
  (actorDisplayName: string, postTitle: string) => string
> = {
  confirm: (actor, title) => `${actor} confirmed your post '${title}'`,
  useful: (actor, title) => `${actor} marked your post '${title}' as useful`,
  fake: (actor, title) => `${actor} marked your post '${title}' as fake`,
  resolved: (actor, title) => `${actor} marked your post '${title}' as resolved`,
};

/**
 * Build the notification content for a reaction, e.g.
 * `Demo Reactor confirmed your post 'Road flooded near market'`.
 */
export function reactionNotificationContent(
  actorDisplayName: string,
  reactionType: ReactionType,
  postTitle: string,
): { title: string; message: string } {
  return {
    title: "New reaction on your post",
    message: REACTION_MESSAGES[reactionType](actorDisplayName, postTitle),
  };
}

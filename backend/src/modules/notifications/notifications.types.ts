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

export const NOTIFIABLE_STATUSES: PostStatus[] = [
  "community_confirmed",
  "admin_verified",
  "rejected",
  "resolved",
  "expired",
];

export function isNotifiableStatusChange(
  previousStatus: PostStatus,
  newStatus: PostStatus,
): boolean {
  return (
    previousStatus !== newStatus &&
    NOTIFIABLE_STATUSES.includes(newStatus)
  );
}

export function notificationContent(
  type: Exclude<NotificationType, "post_reaction">,
  postTitle: string,
): { title: string; message: string } {
  switch (type) {
    case "community_confirmed":
      return {
        title: "Post community confirmed",
        message: `Your post "${postTitle}" was community confirmed.`,
      };
    case "admin_verified":
      return {
        title: "Post verified",
        message: `Your post "${postTitle}" was verified by an admin.`,
      };
    case "rejected":
      return {
        title: "Post rejected",
        message: `Your post "${postTitle}" was rejected.`,
      };
    case "resolved":
      return {
        title: "Post resolved",
        message: `Your post "${postTitle}" was marked as resolved.`,
      };
    case "expired":
      return {
        title: "Post expired",
        message: `Your post "${postTitle}" has expired.`,
      };
  }
}

/** Message fragment per reaction type, e.g. "confirmed your post". */
const REACTION_PHRASES: Record<ReactionType, string> = {
  confirm: "confirmed your post",
  useful: "marked your post as useful",
  fake: "marked your post as fake",
  resolved: "marked your post as resolved",
};

/**
 * Build the notification content for a reaction, e.g.
 * `Demo Reactor confirmed your post "Road flooded near market"`.
 */
export function reactionNotificationContent(
  actorDisplayName: string,
  reactionType: ReactionType,
  postTitle: string,
): { title: string; message: string } {
  return {
    title: "New reaction on your post",
    message: `${actorDisplayName} ${REACTION_PHRASES[reactionType]} "${postTitle}"`,
  };
}

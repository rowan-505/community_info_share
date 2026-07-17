import type { NotificationType, PostStatus, ReactionType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { FastifyError } from "fastify";
import { prisma } from "../../db/prisma.js";
import {
  isNotifiableStatusChange,
  notificationContent,
  reactionNotificationContent,
  type NotificationItem,
} from "./notifications.types.js";

type TransactionClient = Prisma.TransactionClient;

const notificationInclude = {
  actor: { select: { publicId: true, displayName: true } },
  relatedPost: { select: { publicId: true, title: true } },
} satisfies Prisma.NotificationInclude;

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

function createNotFoundError(message: string): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 404;
  return error;
}

function createForbiddenError(message: string): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 403;
  return error;
}

function toNotificationItem(
  notification: NotificationWithRelations,
): NotificationItem {
  return {
    id: notification.publicId,
    publicId: notification.publicId,
    type: notification.type,
    reactionType: notification.reactionType,
    title: notification.title,
    message: notification.message,
    relatedPostPublicId: notification.relatedPost?.publicId ?? null,
    actor: notification.actor
      ? {
          publicId: notification.actor.publicId,
          displayName: notification.actor.displayName,
        }
      : null,
    relatedPost: notification.relatedPost
      ? {
          publicId: notification.relatedPost.publicId,
          title: notification.relatedPost.title,
        }
      : null,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}

export const notificationsRepository = {
  async createForPostStatusChange(
    client: TransactionClient | typeof prisma,
    params: {
      authorId: bigint;
      postId: bigint;
      postTitle: string;
      previousStatus: PostStatus;
      newStatus: PostStatus;
    },
  ): Promise<void> {
    if (!isNotifiableStatusChange(params.previousStatus, params.newStatus)) {
      return;
    }

    const type = params.newStatus as Exclude<NotificationType, "post_reaction">;
    const content = notificationContent(type, params.postTitle);

    await client.notification.create({
      data: {
        userId: params.authorId,
        type,
        title: content.title,
        message: content.message,
        relatedPostId: params.postId,
      },
    });
  },

  /**
   * Create a "post_reaction" notification for the post author. The caller is
   * responsible for the notification rules (skip self-reactions, only notify on
   * a new or changed reaction) and for running this inside the reaction
   * transaction so the notification is only written after the reaction is saved.
   */
  async createForReaction(
    client: TransactionClient | typeof prisma,
    params: {
      recipientUserId: bigint;
      actorUserId: bigint;
      actorDisplayName: string;
      postId: bigint;
      postTitle: string;
      reactionType: ReactionType;
    },
  ): Promise<void> {
    const content = reactionNotificationContent(
      params.actorDisplayName,
      params.reactionType,
      params.postTitle,
    );

    await client.notification.create({
      data: {
        userId: params.recipientUserId,
        actorUserId: params.actorUserId,
        type: "post_reaction",
        reactionType: params.reactionType,
        title: content.title,
        message: content.message,
        relatedPostId: params.postId,
      },
    });
  },

  async findByUserPublicId(userPublicId: string): Promise<NotificationItem[]> {
    const notifications = await prisma.notification.findMany({
      where: { user: { publicId: userPublicId } },
      include: notificationInclude,
      orderBy: { createdAt: "desc" },
    });

    return notifications.map(toNotificationItem);
  },

  async markAsRead(
    notificationPublicId: string,
    userPublicId: string,
  ): Promise<NotificationItem> {
    const notification = await prisma.notification.findUnique({
      where: { publicId: notificationPublicId },
      include: {
        ...notificationInclude,
        user: { select: { publicId: true } },
      },
    });

    if (!notification) {
      throw createNotFoundError("Notification not found");
    }

    if (notification.user.publicId !== userPublicId) {
      throw createForbiddenError("You cannot read another user's notification");
    }

    const updated = await prisma.notification.update({
      where: { publicId: notificationPublicId },
      data: { isRead: true },
      include: notificationInclude,
    });

    return toNotificationItem(updated);
  },
};

import type {
  AuthUser,
  CommunityPost as PrismaCommunityPost,
  PostReaction,
  PostStatus as PrismaPostStatus,
} from "@prisma/client";
import type { FastifyError } from "fastify";
import { prisma } from "../../db/prisma.js";
import { notificationsRepository } from "../notifications/notifications.repository.js";
import type {
  CommunityPost,
  PostReactions,
  PostStatus,
} from "../community-posts/community-posts.types.js";

type PostWithAuthorAndReactions = PrismaCommunityPost & {
  author: AuthUser;
  reactions: PostReaction[];
};

function buildReactionCounts(reactions: PostReaction[]): PostReactions {
  return {
    confirm: reactions.filter((r) => r.reactionType === "confirm").length,
    useful: reactions.filter((r) => r.reactionType === "useful").length,
    fake: reactions.filter((r) => r.reactionType === "fake").length,
    resolved: reactions.filter((r) => r.reactionType === "resolved").length,
  };
}

function toCommunityPost(post: PostWithAuthorAndReactions): CommunityPost {
  return {
    id: post.publicId,
    publicId: post.publicId,
    title: post.title,
    description: post.description,
    topic: post.topic,
    authorName: post.author.displayName,
    status: post.status as PostStatus,
    trustScore: post.trustScore,
    createdAt: post.createdAt.toISOString(),
    reactions: buildReactionCounts(post.reactions),
  };
}

function createNotFoundError(message: string): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 404;
  return error;
}

function createBadRequestError(message: string): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 400;
  return error;
}

const postInclude = {
  author: true,
  reactions: true,
} as const;

export const adminReviewRepository = {
  async findAllPosts(): Promise<CommunityPost[]> {
    const posts = await prisma.communityPost.findMany({
      include: postInclude,
      orderBy: { createdAt: "desc" },
    });

    return posts.map(toCommunityPost);
  },

  async updateStatus(
    publicId: string,
    status: PrismaPostStatus,
    actorPublicId: string,
    options?: { requireCurrentStatus?: PrismaPostStatus },
  ): Promise<CommunityPost> {
    return prisma.$transaction(async (tx) => {
      const [existing, actor] = await Promise.all([
        tx.communityPost.findUnique({ where: { publicId } }),
        tx.authUser.findUnique({ where: { publicId: actorPublicId } }),
      ]);

      if (!existing) {
        throw createNotFoundError("Post not found");
      }

      if (!actor) {
        throw createNotFoundError("Admin actor not found");
      }

      if (
        options?.requireCurrentStatus &&
        existing.status !== options.requireCurrentStatus
      ) {
        throw createBadRequestError(
          `Post must be ${options.requireCurrentStatus} to perform this action (current: ${existing.status})`,
        );
      }

      const post = await tx.communityPost.update({
        where: { publicId },
        data: { status },
        include: postInclude,
      });

      await notificationsRepository.createForPostStatusChange(tx, {
        authorId: existing.authorId,
        actorUserId: actor.id,
        postId: existing.id,
        postTitle: existing.title,
        previousStatus: existing.status,
        newStatus: status,
      });

      return toCommunityPost(post);
    });
  },
};

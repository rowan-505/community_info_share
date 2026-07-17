import type {
  AuthUser,
  CommunityPost as PrismaCommunityPost,
  PostReaction,
  ReactionType as PrismaReactionType,
} from "@prisma/client";
import { PostStatus as PrismaPostStatus } from "@prisma/client";
import type { FastifyError } from "fastify";
import { prisma } from "../../db/prisma.js";
import { DEMO_EMAILS, isDemoModeEnabled } from "../../config/demo.js";
import { notificationsRepository } from "../notifications/notifications.repository.js";
import {
  AUTO_CONFIRM_THRESHOLD,
  BLOCKED_AUTO_CONFIRM_STATUSES,
  DEMO_CONFIRM_MIN,
  DEMO_FAKE_MAX,
  DEMO_TRUST_MIN,
  calculateTrustScore,
  countReactionsByType,
} from "./community-posts.trust.js";
import type {
  CommunityPost,
  CreateCommunityPostInput,
  PostReactions,
  PostStatus,
  ReactionType,
} from "./community-posts.types.js";

const ACTIVE_STATUSES: PrismaPostStatus[] = [
  PrismaPostStatus.free_board,
  PrismaPostStatus.community_confirmed,
  PrismaPostStatus.admin_verified,
];

const RELIABLE_STATUSES: PrismaPostStatus[] = [
  PrismaPostStatus.community_confirmed,
  PrismaPostStatus.admin_verified,
];

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

function resolveStatusAfterReaction(
  currentStatus: PrismaPostStatus,
  trustScore: number,
  reactions: PostReaction[],
  isDemoPost: boolean,
): PrismaPostStatus {
  if (BLOCKED_AUTO_CONFIRM_STATUSES.has(currentStatus)) {
    return currentStatus;
  }

  // Auto-promotion only ever happens from free_board.
  if (currentStatus !== PrismaPostStatus.free_board) {
    return currentStatus;
  }

  // Production rule (UNCHANGED): promote once the trust score is high enough.
  if (trustScore >= AUTO_CONFIRM_THRESHOLD) {
    return PrismaPostStatus.community_confirmed;
  }

  // Demo-only rule: relaxed threshold for demo-created posts while Demo Mode is
  // on. Does not affect real posts or the production threshold above.
  if (isDemoPost) {
    const confirmCount = countReactionsByType(reactions, "confirm");
    const fakeCount = countReactionsByType(reactions, "fake");
    if (
      confirmCount >= DEMO_CONFIRM_MIN &&
      trustScore >= DEMO_TRUST_MIN &&
      fakeCount <= DEMO_FAKE_MAX
    ) {
      return PrismaPostStatus.community_confirmed;
    }
  }

  return currentStatus;
}

const postInclude = {
  author: true,
  reactions: true,
} as const;

export const communityPostsRepository = {
  async findFreeBoardPosts(): Promise<CommunityPost[]> {
    const posts = await prisma.communityPost.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: postInclude,
      orderBy: { createdAt: "desc" },
    });

    return posts.map(toCommunityPost);
  },

  async findReliableBoardPosts(): Promise<CommunityPost[]> {
    const posts = await prisma.communityPost.findMany({
      where: { status: { in: RELIABLE_STATUSES } },
      include: postInclude,
      orderBy: { createdAt: "desc" },
    });

    return posts.map(toCommunityPost);
  },

  async findByPublicId(publicId: string): Promise<CommunityPost | null> {
    const post = await prisma.communityPost.findUnique({
      where: { publicId },
      include: postInclude,
    });

    return post ? toCommunityPost(post) : null;
  },

  async create(
    input: CreateCommunityPostInput,
    authorPublicId: string,
  ): Promise<CommunityPost> {
    const author = await prisma.authUser.findUnique({
      where: { publicId: authorPublicId },
    });

    if (!author) {
      throw createNotFoundError("Author not found");
    }

    const post = await prisma.communityPost.create({
      data: {
        title: input.title,
        description: input.description,
        topic: input.topic,
        authorId: author.id,
        status: PrismaPostStatus.free_board,
        trustScore: 0,
      },
      include: postInclude,
    });

    return toCommunityPost(post);
  },

  async upsertReaction(
    postPublicId: string,
    userPublicId: string,
    reactionType: ReactionType,
  ): Promise<CommunityPost> {
    return prisma.$transaction(async (tx) => {
      const [user, post] = await Promise.all([
        tx.authUser.findUnique({ where: { publicId: userPublicId } }),
        tx.communityPost.findUnique({
          where: { publicId: postPublicId },
          include: { author: { select: { email: true } } },
        }),
      ]);

      if (!post) {
        throw createNotFoundError("Post not found");
      }

      if (!user) {
        throw createNotFoundError("User not found");
      }

      // A post is treated as demo-created only when Demo Mode is enabled AND its
      // author is one of the fixed demo emails. This gates the relaxed threshold.
      const isDemoPost =
        isDemoModeEnabled() && DEMO_EMAILS.has(post.author.email);

      // Capture the previous reaction (if any) BEFORE upserting so we can decide
      // whether the reaction actually changed and a notification is warranted.
      const existingReaction = await tx.postReaction.findUnique({
        where: { postId_userId: { postId: post.id, userId: user.id } },
        select: { reactionType: true },
      });
      const previousReactionType = existingReaction?.reactionType ?? null;
      const nextReactionType = reactionType as PrismaReactionType;

      await tx.postReaction.upsert({
        where: {
          postId_userId: {
            postId: post.id,
            userId: user.id,
          },
        },
        create: {
          postId: post.id,
          userId: user.id,
          reactionType: nextReactionType,
        },
        update: {
          reactionType: nextReactionType,
        },
      });

      const reactions = await tx.postReaction.findMany({
        where: { postId: post.id },
      });

      const trustScore = calculateTrustScore(reactions);
      const status = resolveStatusAfterReaction(
        post.status,
        trustScore,
        reactions,
        isDemoPost,
      );

      const updatedPost = await tx.communityPost.update({
        where: { id: post.id },
        data: { trustScore, status },
        include: postInclude,
      });

      await notificationsRepository.createForPostStatusChange(tx, {
        authorId: post.authorId,
        postId: post.id,
        postTitle: post.title,
        previousStatus: post.status,
        newStatus: status,
      });

      // Reaction notification for the post author. Only when the reactor is not
      // the author AND the reaction was newly created or changed type (so an
      // identical repeated reaction produces no duplicate notification).
      const isSelfReaction = post.authorId === user.id;
      const reactionChanged = previousReactionType !== nextReactionType;
      if (!isSelfReaction && reactionChanged) {
        await notificationsRepository.createForReaction(tx, {
          recipientUserId: post.authorId,
          actorUserId: user.id,
          actorDisplayName: user.displayName,
          postId: post.id,
          postTitle: post.title,
          reactionType: nextReactionType,
        });
      }

      return toCommunityPost(updatedPost);
    });
  },
};

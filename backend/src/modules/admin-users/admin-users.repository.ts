import type { FastifyError } from "fastify";
import { prisma } from "../../db/prisma.js";
import {
  ACCOUNT_STATUS,
  toDisplayAccountStatus,
  type CoreMapAccountStatus,
} from "../../shared/account-status.js";
import { mapRoles } from "../auth/auth.repository.js";
import { PROTECTED_ROLES } from "./admin-users.schema.js";
import type { ModeratedUser } from "./admin-users.types.js";

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

function createBadRequestError(message: string): FastifyError {
  const error = new Error(message) as FastifyError;
  error.statusCode = 400;
  return error;
}

const userWithRolesInclude = {
  userRoles: { include: { role: true } },
  _count: { select: { posts: true } },
} as const;

function toModeratedUser(
  user: {
    publicId: string;
    email: string;
    displayName: string;
    accountStatus: string;
    isActive: boolean;
    userRoles: { role: { code: string } }[];
    _count: { posts: number };
  },
): ModeratedUser {
  return {
    publicId: user.publicId,
    email: user.email,
    displayName: user.displayName,
    // Never expose a raw value outside the CoreMap set (active/disabled/deleted).
    accountStatus: toDisplayAccountStatus(user.accountStatus),
    isActive: user.isActive,
    roles: user.userRoles.map((ur) => ur.role.code),
    postCount: user._count.posts,
  };
}

export const adminUsersRepository = {
  /**
   * List users who have participated in the community (authored a post or
   * reacted). Keeps the moderation list focused and avoids dumping the entire
   * shared CoreMap auth table.
   */
  async findCommunityUsers(): Promise<ModeratedUser[]> {
    const users = await prisma.authUser.findMany({
      where: {
        OR: [{ posts: { some: {} } }, { reactions: { some: {} } }],
      },
      include: userWithRolesInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return users.map(toModeratedUser);
  },

  /**
   * Updates ONLY the single target user (matched by public_id) inside a
   * transaction. `accountStatus` is restricted to the CoreMap CHECK-constraint
   * values so the write can never violate auth_users_account_status_chk.
   */
  async updateAccountStatus(params: {
    targetPublicId: string;
    actorPublicId: string;
    accountStatus: CoreMapAccountStatus;
    isActive: boolean;
    revokeSessions: boolean;
    /** Human label for admin_note (e.g. "suspended"/"banned"); null clears it. */
    moderationLabel: string | null;
  }): Promise<ModeratedUser> {
    if (params.targetPublicId === params.actorPublicId) {
      throw createBadRequestError("You cannot moderate your own account");
    }

    return prisma.$transaction(async (tx) => {
      const target = await tx.authUser.findUnique({
        where: { publicId: params.targetPublicId },
        include: { userRoles: { include: { role: true } } },
      });

      if (!target) {
        throw createNotFoundError("User not found");
      }

      const targetRoles = mapRoles(target);
      if (targetRoles.some((role) => PROTECTED_ROLES.has(role))) {
        throw createForbiddenError("Cannot moderate an admin account");
      }

      const updated = await tx.authUser.update({
        where: { id: target.id },
        data: {
          accountStatus: params.accountStatus,
          isActive: params.isActive,
          // admin_note keeps the human intent (suspended vs banned) since the
          // DB column can only store "disabled" for both.
          adminNote:
            params.accountStatus === ACCOUNT_STATUS.active
              ? null
              : `Moderated to ${params.moderationLabel ?? params.accountStatus} by community admin`,
        },
        include: userWithRolesInclude,
      });

      if (params.revokeSessions) {
        await tx.authSession.updateMany({
          where: { userId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return toModeratedUser(updated);
    });
  },
};

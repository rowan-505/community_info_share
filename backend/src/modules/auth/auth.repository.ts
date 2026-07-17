import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

const userWithRolesInclude = {
  userRoles: { include: { role: true } },
} satisfies Prisma.AuthUserInclude;

export type AuthUserWithRoles = Prisma.AuthUserGetPayload<{
  include: typeof userWithRolesInclude;
}>;

export type AuthSessionWithUser = Prisma.AuthSessionGetPayload<{
  include: { user: { include: typeof userWithRolesInclude } };
}>;

export function mapRoles(user: AuthUserWithRoles): string[] {
  return user.userRoles.map((ur) => ur.role.code);
}

export interface CreateSessionInput {
  userId: bigint;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export const authRepository = {
  findUserByEmail(email: string): Promise<AuthUserWithRoles | null> {
    return prisma.authUser.findUnique({
      where: { email },
      include: userWithRolesInclude,
    });
  },

  findProfileByPublicId(publicId: string): Promise<AuthUserWithRoles | null> {
    return prisma.authUser.findUnique({
      where: { publicId },
      include: userWithRolesInclude,
    });
  },

  /**
   * Public registration. In a single transaction:
   *  1. look up the "user" role,
   *  2. insert the auth user,
   *  3. assign the "user" role,
   *  4. re-read the user with roles.
   * Public signups can only ever receive the "user" role.
   */
  async createPublicUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<AuthUserWithRoles> {
    return prisma.$transaction(async (tx) => {
      const userRole = await tx.authRole.findUnique({ where: { code: "user" } });
      if (!userRole) {
        const error = new Error('Default "user" role is not configured');
        (error as { statusCode?: number }).statusCode = 500;
        throw error;
      }

      const created = await tx.authUser.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          displayName: input.displayName,
        },
      });

      await tx.authUserRole.create({
        data: { userId: created.id, roleId: userRole.id },
      });

      return tx.authUser.findUniqueOrThrow({
        where: { id: created.id },
        include: userWithRolesInclude,
      });
    });
  },

  async touchLastLogin(userId: bigint): Promise<void> {
    const now = new Date();
    await prisma.authUser.update({
      where: { id: userId },
      data: { lastLoginAt: now, lastSeenAt: now },
    });
  },

  async updatePasswordHash(userId: bigint, passwordHash: string): Promise<void> {
    await prisma.authUser.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  async createSession(input: CreateSessionInput): Promise<void> {
    await prisma.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        lastUsedAt: new Date(),
      },
    });
  },

  findActiveSessionByTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionWithUser | null> {
    return prisma.authSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: userWithRolesInclude } },
    });
  },

  /**
   * Revoke any session matching this refresh-token hash. Idempotent: revoking an
   * already-revoked or unknown token is a no-op.
   */
  async revokeSessionByTokenHash(refreshTokenHash: string): Promise<void> {
    await prisma.authSession.updateMany({
      where: { refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};

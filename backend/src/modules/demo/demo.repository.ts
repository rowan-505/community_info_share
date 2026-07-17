import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import {
  DEMO_EMAILS,
  DEMO_PASSWORD,
  type DemoUserConfig,
} from "../../config/demo.js";
import { ACCOUNT_STATUS } from "../../shared/account-status.js";
import type { AuthUserWithRoles } from "../auth/auth.repository.js";
import { hashPassword } from "../auth/password.js";
import type { DemoResetResult } from "./demo.types.js";

const userWithRolesInclude = {
  userRoles: { include: { role: true } },
} satisfies Prisma.AuthUserInclude;

export const demoRepository = {
  /**
   * Idempotently ensure a demo user exists in app_auth.auth_users with the
   * requested role. If the exact demo email already exists, the row is reused
   * (never duplicated); a missing role assignment is topped up. Runs in a
   * transaction so the user + role assignment are created atomically.
   */
  async ensureDemoUser(config: DemoUserConfig): Promise<AuthUserWithRoles> {
    return prisma.$transaction(async (tx) => {
      const role = await tx.authRole.findUnique({
        where: { code: config.roleCode },
      });
      if (!role) {
        const error = new Error(
          `Required role "${config.roleCode}" is not configured in app_auth.auth_roles`,
        );
        (error as { statusCode?: number }).statusCode = 500;
        throw error;
      }

      let user = await tx.authUser.findUnique({
        where: { email: config.email },
      });

      if (!user) {
        const passwordHash = await hashPassword(DEMO_PASSWORD);
        user = await tx.authUser.create({
          data: {
            email: config.email,
            passwordHash,
            displayName: config.displayName,
            isActive: true,
            accountStatus: "active",
            emailVerified: true,
          },
        });
      }

      await tx.authUserRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });

      return tx.authUser.findUniqueOrThrow({
        where: { id: user.id },
        include: userWithRolesInclude,
      });
    });
  },

  /**
   * Delete ONLY demo-created data, in one transaction. Safe on the shared
   * CoreMap database: every delete is scoped to IDs first collected from the
   * three fixed demo users. Never truncates, never drops, never deletes the
   * demo users themselves, and never touches non-demo rows.
   */
  async resetDemoData(): Promise<DemoResetResult> {
    return prisma.$transaction(async (tx) => {
      // 1. Resolve demo user IDs by their exact fixed emails.
      const demoUsers = await tx.authUser.findMany({
        where: { email: { in: [...DEMO_EMAILS] } },
        select: { id: true, email: true },
      });
      const demoUserIds = demoUsers.map((user) => user.id);

      // No demo users -> nothing demo-owned can exist. Never run unscoped deletes.
      if (demoUserIds.length === 0) {
        return {
          demoUserCount: 0,
          postsDeleted: 0,
          reactionsDeleted: 0,
          notificationsDeleted: 0,
          sessionsDeleted: 0,
        };
      }

      // 2. Collect demo-created post IDs (authored by a demo user only).
      const demoPosts = await tx.communityPost.findMany({
        where: { authorId: { in: demoUserIds } },
        select: { id: true, authorId: true },
      });

      // 3. Safety guard: abort if any collected post is not demo-owned.
      const demoUserIdSet = new Set(demoUserIds.map((id) => id.toString()));
      const foreignPost = demoPosts.find(
        (post) => !demoUserIdSet.has(post.authorId.toString()),
      );
      if (foreignPost) {
        throw new Error(
          "Demo reset safety guard: refusing to delete a non-demo-owned post",
        );
      }

      const demoPostIds = demoPosts.map((post) => post.id);

      // 4. Reactions attached to demo posts.
      const reactions = await tx.postReaction.deleteMany({
        where: { postId: { in: demoPostIds } },
      });

      // 5. Notifications tied to demo posts or owned by demo users. Deleted
      //    before the posts so the SetNull relation never orphans a row.
      const notifications = await tx.notification.deleteMany({
        where: {
          OR: [
            { relatedPostId: { in: demoPostIds } },
            { userId: { in: demoUserIds } },
          ],
        },
      });

      // 6. The demo posts themselves.
      const posts = await tx.communityPost.deleteMany({
        where: { id: { in: demoPostIds } },
      });

      // 7. Demo users' own sessions (scoped strictly to demo user IDs). The
      //    demo user rows are intentionally kept so they stay reusable.
      const sessions = await tx.authSession.deleteMany({
        where: { userId: { in: demoUserIds } },
      });

      // 8. Restore demo users to active so a previous suspend/ban does not
      //    stick after Reset Demo Data.
      await tx.authUser.updateMany({
        where: { id: { in: demoUserIds } },
        data: {
          accountStatus: ACCOUNT_STATUS.active,
          isActive: true,
          adminNote: null,
        },
      });

      return {
        demoUserCount: demoUserIds.length,
        postsDeleted: posts.count,
        reactionsDeleted: reactions.count,
        notificationsDeleted: notifications.count,
        sessionsDeleted: sessions.count,
      };
    });
  },
};

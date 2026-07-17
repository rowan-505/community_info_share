import {
  DEMO_USERS,
  getDemoUserByKey,
  isDemoModeEnabled,
  type DemoUserKey,
} from "../../config/demo.js";
import { isBlockedAccount } from "../../shared/account-status.js";
import { AuthError, authService } from "../auth/auth.service.js";
import type { RequestMeta, SessionContext } from "../auth/auth.types.js";
import { communityPostsService } from "../community-posts/community-posts.service.js";
import type { CommunityPost } from "../community-posts/community-posts.types.js";
import { demoRepository } from "./demo.repository.js";
import { DEMO_SAMPLE_POST } from "./demo.schema.js";
import type { DemoResetResult, DemoStatusResponse } from "./demo.types.js";

function ensureDemoUser(key: DemoUserKey) {
  return demoRepository.ensureDemoUser(getDemoUserByKey(key));
}

async function createDemoPost(): Promise<CommunityPost> {
  const demoUser = await ensureDemoUser("user");
  // Reuse the normal community-post service: route -> service -> repository ->
  // Prisma. Stored as free_board with trust_score 0 by the standard flow.
  return communityPostsService.createPost(DEMO_SAMPLE_POST, demoUser.publicId);
}

export const demoService = {
  status(): DemoStatusResponse {
    return {
      enabled: isDemoModeEnabled(),
      users: DEMO_USERS.map((user) => ({
        key: user.key,
        email: user.email,
        displayName: user.displayName,
        roleCode: user.roleCode,
      })),
    };
  },

  /** Ensure the demo user exists, then mint a real backend-signed session. */
  async createSession(
    key: DemoUserKey,
    meta: RequestMeta,
  ): Promise<SessionContext> {
    const user = await ensureDemoUser(key);
    // Respect real moderation rules even for demo login: any disabled /
    // deleted / inactive account is blocked.
    if (isBlockedAccount(user.isActive, user.accountStatus)) {
      throw new AuthError("Account is disabled", 403);
    }
    return authService.issueSessionForUser(user, meta);
  },

  createDemoPost,

  resetDemoData(): Promise<DemoResetResult> {
    return demoRepository.resetDemoData();
  },

  /**
   * Automated confirm flow for the classroom: ensure users, create the demo
   * post as Demo User, then add ONE confirm reaction as Demo Reactor through
   * the normal reaction flow (which auto-promotes it to community_confirmed via
   * the demo threshold). Deliberately does NOT auto-verify as admin.
   */
  async runFullDemo(): Promise<CommunityPost> {
    await ensureDemoUser("user");
    const reactor = await ensureDemoUser("reactor");
    const post = await createDemoPost();
    return communityPostsService.addReaction(
      post.publicId,
      reactor.publicId,
      "confirm",
    );
  },
};

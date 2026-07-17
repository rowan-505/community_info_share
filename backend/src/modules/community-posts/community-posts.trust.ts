import type { ReactionType } from "@prisma/client";

export const REACTION_SCORES: Record<ReactionType, number> = {
  confirm: 2,
  useful: 1,
  fake: -3,
  resolved: 0,
};

/**
 * Production auto-confirm threshold (UNCHANGED). A free_board post is promoted
 * to community_confirmed once its summed trust score reaches this value.
 */
export const AUTO_CONFIRM_THRESHOLD = 8;

/**
 * Demo-only auto-confirm rule. Applies ONLY to demo-created posts while Demo
 * Mode is enabled; it never affects real posts or the production threshold.
 * One Confirm reaction (+2, no fakes) is enough to reach the Reliable Board.
 */
export const DEMO_CONFIRM_MIN = 1;
export const DEMO_TRUST_MIN = 2;
export const DEMO_FAKE_MAX = 0;

export const BLOCKED_AUTO_CONFIRM_STATUSES = new Set([
  "rejected",
  "expired",
  "resolved",
]);

export function calculateTrustScore(
  reactions: { reactionType: ReactionType }[],
): number {
  return reactions.reduce(
    (sum, reaction) => sum + REACTION_SCORES[reaction.reactionType],
    0,
  );
}

export function countReactionsByType(
  reactions: { reactionType: ReactionType }[],
  type: ReactionType,
): number {
  return reactions.filter((reaction) => reaction.reactionType === type).length;
}

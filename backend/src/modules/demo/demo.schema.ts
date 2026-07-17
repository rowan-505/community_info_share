import type { CreateCommunityPostInput } from "../community-posts/community-posts.types.js";

/**
 * Fixed sample content for the demo post. Authored by Demo User and created
 * through the normal community-post service, so it starts in `free_board` with
 * `trust_score = 0`. It is identified as demo-created purely by its demo author.
 */
export const DEMO_SAMPLE_POST: CreateCommunityPostInput = {
  title: "Heavy rain and flooding near local market",
  topic: "safety",
  description:
    "Community members reported temporary flooding near the market road.",
};

import type { FastifyInstance } from "fastify";
import { toRouteRateLimit } from "../../config/rate-limit.js";
import { bearerSecurity, commonErrors } from "../../openapi/schemas.js";
import { createPostSchema, reactionSchema } from "./community-posts.schema.js";
import { communityPostsService } from "./community-posts.service.js";

const protectedContent = (app: FastifyInstance) => [
  app.authenticate,
  app.requireActiveAccount,
];

export async function communityPostsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get("/community/posts/free-board", {
    schema: {
      tags: ["Community Posts"],
      summary: "List free board posts",
      description: "Returns active public posts (free_board, community_confirmed, admin_verified).",
      response: {
        200: {
          description: "List of posts",
          ...{ $ref: "CommunityPostsResponse#" },
        },
        500: commonErrors[500],
      },
    },
  }, async () => {
    const posts = await communityPostsService.getFreeBoardPosts();
    return { data: posts };
  });

  app.get("/community/posts/reliable-board", {
    schema: {
      tags: ["Community Posts"],
      summary: "List reliable board posts",
      description: "Returns community_confirmed and admin_verified posts only.",
      response: {
        200: {
          description: "List of verified posts",
          ...{ $ref: "CommunityPostsResponse#" },
        },
        500: commonErrors[500],
      },
    },
  }, async () => {
    const posts = await communityPostsService.getReliableBoardPosts();
    return { data: posts };
  });

  app.get("/community/posts/:publicId", {
    schema: {
      tags: ["Community Posts"],
      summary: "Get post by public ID",
      params: { $ref: "PublicIdParam#" },
      response: {
        200: {
          description: "Single post",
          ...{ $ref: "CommunityPostResponse#" },
        },
        404: commonErrors[404],
        500: commonErrors[500],
      },
    },
  }, async (request) => {
    const { publicId } = request.params as { publicId: string };
    const post = await communityPostsService.getPostByPublicId(publicId);
    return { data: post };
  });

  app.post(
    "/community/posts",
    {
      preHandler: protectedContent(app),
      config: {
        rateLimit: toRouteRateLimit(app.rateLimits.createPost),
      },
      schema: {
        tags: ["Community Posts"],
        summary: "Create a community post",
        security: bearerSecurity,
        body: { $ref: "CreatePostBody#" },
        response: {
          201: {
            description: "Post created",
            ...{ $ref: "CommunityPostResponse#" },
          },
          400: commonErrors[400],
          401: commonErrors[401],
          403: commonErrors[403],
          429: commonErrors[429],
        },
      },
    },
    async (request, reply) => {
      const parsed = createPostSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }

      const { sub } = request.user as { sub: string };
      const post = await communityPostsService.createPost(parsed.data, sub);
      return reply.status(201).send({ data: post });
    },
  );

  app.post(
    "/community/posts/:publicId/reactions",
    {
      preHandler: protectedContent(app),
      config: {
        rateLimit: toRouteRateLimit(app.rateLimits.reactions),
      },
      schema: {
        tags: ["Reactions"],
        summary: "Add or update a reaction on a post",
        description: "One reaction per user per post. Updates trust score and may auto-confirm post.",
        security: bearerSecurity,
        params: { $ref: "PublicIdParam#" },
        body: { $ref: "ReactionBody#" },
        response: {
          200: {
            description: "Updated post with reaction counts",
            ...{ $ref: "CommunityPostResponse#" },
          },
          400: commonErrors[400],
          401: commonErrors[401],
          403: commonErrors[403],
          404: commonErrors[404],
          429: commonErrors[429],
        },
      },
    },
    async (request, reply) => {
      const { publicId } = request.params as { publicId: string };
      const parsed = reactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }

      const { sub } = request.user as { sub: string };
      const post = await communityPostsService.addReaction(
        publicId,
        sub,
        parsed.data.reactionType,
      );

      return reply.send({ data: post });
    },
  );
}

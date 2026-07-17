import type { FastifyInstance } from "fastify";
import { bearerSecurity, commonErrors } from "../../openapi/schemas.js";
import { REVIEWER_ROLES } from "./admin-review.schema.js";
import { adminReviewService } from "./admin-review.service.js";

export async function adminReviewRoutes(app: FastifyInstance): Promise<void> {
  const reviewerOnly = {
    preHandler: [app.authenticate, app.requireRole(...REVIEWER_ROLES)],
  };

  const postActionSchema = (summary: string, description: string) => ({
    tags: ["Admin Review"],
    summary,
    description,
    security: bearerSecurity,
    params: { $ref: "PublicIdParam#" },
    response: {
      200: {
        description: "Updated post",
        ...{ $ref: "CommunityPostResponse#" },
      },
      401: commonErrors[401],
      403: commonErrors[403],
      404: commonErrors[404],
    },
  });

  app.get("/admin/community/posts", {
    ...reviewerOnly,
    schema: {
      tags: ["Admin Review"],
      summary: "List all posts for review",
      description: "Requires admin or validator role.",
      security: bearerSecurity,
      response: {
        200: {
          description: "All community posts",
          ...{ $ref: "CommunityPostsResponse#" },
        },
        401: commonErrors[401],
        403: commonErrors[403],
      },
    },
  }, async () => {
    const posts = await adminReviewService.getPosts();
    return { data: posts };
  });

  app.post(
    "/admin/community/posts/:publicId/verify",
    {
      ...reviewerOnly,
      schema: postActionSchema("Verify post", "Sets post status to admin_verified."),
    },
    async (request) => {
      const { publicId } = request.params as { publicId: string };
      const post = await adminReviewService.verify(publicId);
      return { data: post };
    },
  );

  app.post(
    "/admin/community/posts/:publicId/reject",
    {
      ...reviewerOnly,
      schema: postActionSchema("Reject post", "Sets post status to rejected."),
    },
    async (request) => {
      const { publicId } = request.params as { publicId: string };
      const post = await adminReviewService.reject(publicId);
      return { data: post };
    },
  );

  app.post(
    "/admin/community/posts/:publicId/resolve",
    {
      ...reviewerOnly,
      schema: postActionSchema("Resolve post", "Sets post status to resolved."),
    },
    async (request) => {
      const { publicId } = request.params as { publicId: string };
      const post = await adminReviewService.resolve(publicId);
      return { data: post };
    },
  );

  app.post(
    "/admin/community/posts/:publicId/expire",
    {
      ...reviewerOnly,
      schema: postActionSchema("Expire post", "Sets post status to expired."),
    },
    async (request) => {
      const { publicId } = request.params as { publicId: string };
      const post = await adminReviewService.expire(publicId);
      return { data: post };
    },
  );
}

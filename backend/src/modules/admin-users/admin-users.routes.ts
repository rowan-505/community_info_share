import type { FastifyInstance } from "fastify";
import { bearerSecurity, commonErrors } from "../../openapi/schemas.js";
import { MODERATOR_ROLES } from "./admin-users.schema.js";
import { adminUsersService } from "./admin-users.service.js";

export async function adminUsersRoutes(app: FastifyInstance): Promise<void> {
  const moderatorOnly = {
    preHandler: [app.authenticate, app.requireRole(...MODERATOR_ROLES)],
  };

  app.get(
    "/admin/users",
    {
      ...moderatorOnly,
      schema: {
        tags: ["Moderation"],
        summary: "List community users for moderation",
        description:
          "Returns users who have posted or reacted in the community, with account status.",
        security: bearerSecurity,
        response: {
          200: { description: "Community users" },
          401: commonErrors[401],
          403: commonErrors[403],
        },
      },
    },
    async () => {
      const users = await adminUsersService.listUsers();
      return { data: users };
    },
  );

  const moderationAction = (
    path: string,
    summary: string,
    action: "suspend" | "ban" | "unban",
  ) => {
    app.post(
      path,
      {
        ...moderatorOnly,
        schema: {
          tags: ["Moderation"],
          summary,
          security: bearerSecurity,
          params: { $ref: "PublicIdParam#" },
          response: {
            200: { description: "Updated user" },
            400: commonErrors[400],
            401: commonErrors[401],
            403: commonErrors[403],
            404: commonErrors[404],
          },
        },
      },
      async (request) => {
        const { publicId } = request.params as { publicId: string };
        const { sub } = request.user;
        const user = await adminUsersService[action](publicId, sub);
        return { data: user };
      },
    );
  };

  moderationAction(
    "/admin/users/:publicId/suspend",
    "Suspend a user (can log in, cannot create posts or react)",
    "suspend",
  );
  moderationAction(
    "/admin/users/:publicId/ban",
    "Ban a user (cannot log in; sessions revoked)",
    "ban",
  );
  moderationAction(
    "/admin/users/:publicId/unban",
    "Restore a user to active",
    "unban",
  );
}

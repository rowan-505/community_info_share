import type { FastifyInstance } from "fastify";
import { bearerSecurity, commonErrors } from "../../openapi/schemas.js";
import { notificationsService } from "./notifications.service.js";

const protectedRoute = (app: FastifyInstance) => [app.authenticate];

export async function notificationsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/notifications",
    {
      preHandler: protectedRoute(app),
      schema: {
        tags: ["Notifications"],
        summary: "List my notifications",
        description: "Returns notifications for the authenticated user only.",
        security: bearerSecurity,
        response: {
          200: {
            description: "User notifications",
            ...{ $ref: "NotificationsResponse#" },
          },
          401: commonErrors[401],
          403: commonErrors[403],
        },
      },
    },
    async (request) => {
      const { sub } = request.user as { sub: string };
      const notifications = await notificationsService.getMyNotifications(sub);
      return { data: notifications };
    },
  );

  app.patch(
    "/notifications/:publicId/read",
    {
      preHandler: protectedRoute(app),
      schema: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        security: bearerSecurity,
        params: { $ref: "PublicIdParam#" },
        response: {
          200: {
            description: "Updated notification",
            ...{ $ref: "NotificationResponse#" },
          },
          401: commonErrors[401],
          403: commonErrors[403],
          404: commonErrors[404],
        },
      },
    },
    async (request) => {
      const { publicId } = request.params as { publicId: string };
      const { sub } = request.user as { sub: string };
      const notification = await notificationsService.markAsRead(publicId, sub);
      return { data: notification };
    },
  );
}

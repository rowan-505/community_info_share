import type { FastifyInstance } from "fastify";
import { commonErrors } from "../../openapi/schemas.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", {
    schema: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns service health status.",
      response: {
        200: {
          description: "Service is healthy",
          ...{ $ref: "HealthResponse#" },
        },
        500: commonErrors[500],
      },
    },
  }, async () => {
    return { status: "ok" };
  });
}

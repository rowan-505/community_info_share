import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { allSchemas } from "../openapi/schemas.js";

async function swaggerPlugin(app: import("fastify").FastifyInstance) {
  for (const schema of allSchemas) {
    app.addSchema(schema);
  }

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Community Info & News API",
        description:
          "REST API for community posts, reactions, authentication, admin review, notifications, and moderation.",
        version: "1.0.0",
      },
      tags: [
        { name: "Health", description: "Service health checks" },
        {
          name: "Auth",
          description: "Registration, login, refresh, logout, and current user",
        },
        { name: "Community Posts", description: "Public boards and post creation" },
        { name: "Reactions", description: "Post reactions and trust score" },
        { name: "Admin Review", description: "Admin post review actions" },
        { name: "Notifications", description: "In-app user notifications" },
        { name: "Moderation", description: "Admin user suspend/ban/unban controls" },
        {
          name: "Demo",
          description:
            "Showcase helpers enabled only when DEMO_MODE=true (real JWTs, no auth bypass)",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "Access JWT from /auth/login or /auth/refresh (register does not issue a token)",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}

export const registerSwaggerPlugin = fp(swaggerPlugin);

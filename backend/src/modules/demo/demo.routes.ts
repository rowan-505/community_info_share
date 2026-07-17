import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isDemoModeEnabled, type DemoUserKey } from "../../config/demo.js";
import { commonErrors } from "../../openapi/schemas.js";
import { buildSessionResponse } from "../auth/session.js";
import { demoService } from "./demo.service.js";

function requestMeta(request: FastifyRequest) {
  return {
    userAgent: request.headers["user-agent"] ?? null,
    ipAddress: request.ip ?? null,
  };
}

/**
 * Development-only Demo Mode routes. This whole plugin is registered only when
 * `isDemoModeEnabled()` is true (see app.ts), so in production the routes do
 * not exist (404). The per-request `demoGuard` is defense-in-depth in case the
 * process env changes after boot.
 */
export async function demoRoutes(app: FastifyInstance): Promise<void> {
  const demoGuard = async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!isDemoModeEnabled()) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Demo Mode is disabled",
      });
    }
  };

  app.get(
    "/demo/status",
    {
      schema: {
        tags: ["Demo"],
        summary: "Report whether Demo Mode is enabled and list the demo users",
      },
    },
    async () => demoService.status(),
  );

  const registerLogin = (key: DemoUserKey, path: string, summary: string) => {
    app.post(
      path,
      {
        preHandler: [demoGuard],
        schema: {
          tags: ["Demo"],
          summary,
          description:
            "Development only. Issues a real backend-signed JWT session for the fixed demo user.",
          response: {
            200: { description: "Demo session", ...{ $ref: "SessionResponse#" } },
            403: commonErrors[403],
          },
        },
      },
      async (request, reply) => {
        const session = await demoService.createSession(key, requestMeta(request));
        return reply.send(await buildSessionResponse(reply, session));
      },
    );
  };

  registerLogin("user", "/demo/login/user", "Demo login as Demo User (role: user)");
  registerLogin(
    "reactor",
    "/demo/login/reactor",
    "Demo login as Demo Reactor (role: user)",
  );
  registerLogin("admin", "/demo/login/admin", "Demo login as Demo Admin (role: admin)");

  app.post(
    "/demo/create-post",
    {
      preHandler: [demoGuard],
      schema: {
        tags: ["Demo"],
        summary: "Create the sample demo post authored by Demo User",
        response: {
          201: { description: "Created demo post", ...{ $ref: "CommunityPostResponse#" } },
          403: commonErrors[403],
        },
      },
    },
    async (_request, reply) => {
      const post = await demoService.createDemoPost();
      return reply.status(201).send({ data: post });
    },
  );

  app.post(
    "/demo/run-full",
    {
      preHandler: [demoGuard],
      schema: {
        tags: ["Demo"],
        summary: "Run the automated one-confirm demo (no admin verify)",
        description:
          "Ensures demo users, creates the demo post as Demo User, and adds one Confirm reaction as Demo Reactor. The post becomes community_confirmed via the demo threshold.",
        response: {
          200: { description: "Confirmed demo post", ...{ $ref: "CommunityPostResponse#" } },
          403: commonErrors[403],
        },
      },
    },
    async (_request, reply) => {
      const post = await demoService.runFullDemo();
      return reply.send({ data: post });
    },
  );

  app.post(
    "/demo/reset",
    {
      preHandler: [demoGuard],
      schema: {
        tags: ["Demo"],
        summary: "Delete only demo-created data (posts, reactions, demo notifications, demo sessions)",
        response: {
          403: commonErrors[403],
        },
      },
    },
    async (_request, reply) => {
      const result = await demoService.resetDemoData();
      return reply.send({ data: result });
    },
  );
}

import type { FastifyInstance, FastifyRequest } from "fastify";
import { toRouteRateLimit } from "../../config/rate-limit.js";
import { bearerSecurity, commonErrors } from "../../openapi/schemas.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "./auth.schema.js";
import { authService } from "./auth.service.js";
import { buildSessionResponse } from "./session.js";

function requestMeta(request: FastifyRequest) {
  return {
    userAgent: request.headers["user-agent"] ?? null,
    ipAddress: request.ip ?? null,
  };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/auth/register",
    {
      config: {
        rateLimit: toRouteRateLimit(app.rateLimits.register),
      },
      schema: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Creates a shared CoreMap account with the 'user' role. Returns no token; log in afterwards.",
        body: { $ref: "RegisterBody#" },
        response: {
          201: { description: "Account created", ...{ $ref: "RegisterResponse#" } },
          400: commonErrors[400],
          409: commonErrors[409],
          429: commonErrors[429],
        },
      },
    },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }

      const user = await authService.register(parsed.data);
      return reply.status(201).send({ message: "Account created", user });
    },
  );

  app.post(
    "/auth/login",
    {
      config: {
        rateLimit: toRouteRateLimit(app.rateLimits.login),
      },
      schema: {
        tags: ["Auth"],
        summary: "Login",
        body: { $ref: "LoginBody#" },
        response: {
          200: { description: "Login successful", ...{ $ref: "SessionResponse#" } },
          400: commonErrors[400],
          401: commonErrors[401],
          403: commonErrors[403],
          429: commonErrors[429],
        },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }

      const session = await authService.login(parsed.data, requestMeta(request));
      return reply.send(await buildSessionResponse(reply, session));
    },
  );

  app.post(
    "/auth/refresh",
    {
      config: {
        rateLimit: toRouteRateLimit(app.rateLimits.login),
      },
      schema: {
        tags: ["Auth"],
        summary: "Rotate session and issue a new access token",
        body: { $ref: "RefreshBody#" },
        response: {
          200: { description: "New session issued", ...{ $ref: "SessionResponse#" } },
          400: commonErrors[400],
          401: commonErrors[401],
          403: commonErrors[403],
          429: commonErrors[429],
        },
      },
    },
    async (request, reply) => {
      const parsed = refreshSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }

      const session = await authService.refresh(
        parsed.data.refreshToken,
        requestMeta(request),
      );
      return reply.send(await buildSessionResponse(reply, session));
    },
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Revoke a refresh-token session (idempotent)",
        body: { $ref: "LogoutBody#" },
        response: {
          200: { description: "Logged out", ...{ $ref: "MessageResponse#" } },
          400: commonErrors[400],
        },
      },
    },
    async (request, reply) => {
      const parsed = logoutSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        });
      }

      await authService.logout(parsed.data.refreshToken);
      return reply.send({ message: "Logged out" });
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: bearerSecurity,
        response: {
          200: { description: "Current authenticated user", ...{ $ref: "AuthProfile#" } },
          401: commonErrors[401],
          403: commonErrors[403],
        },
      },
    },
    async (request) => {
      const { sub } = request.user;
      return authService.getMe(sub);
    },
  );
}

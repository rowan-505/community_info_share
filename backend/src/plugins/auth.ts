import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import {
  canCreateContent,
  isBlockedAccount,
} from "../shared/account-status.js";
import { prisma } from "../db/prisma.js";

async function authPlugin(app: import("fastify").FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  // HS256 (default) with the shared CoreMap secret. Access tokens signed here or
  // by CoreMap are mutually verifiable when the secret matches.
  await app.register(fastifyJwt, { secret });

  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid or missing token",
        });
      }
    },
  );

  /**
   * Role gate. Allows the request when the JWT `roles` claim contains at least
   * one of the allowed role codes; otherwise responds 403. Trusts the JWT roles
   * claim (which mirrors app_auth.auth_user_roles at sign time).
   */
  app.decorate("requireRole", function requireRole(
    ...allowedRoles: string[]
  ): preHandlerHookHandler {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const roles = request.user?.roles ?? [];
      const permitted = allowedRoles.some((role) => roles.includes(role));

      if (!permitted) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Insufficient role",
        });
      }
    };
  });

  /**
   * Re-reads the current account from app_auth.auth_users by public_id and
   * ensures it may create content (posts / reactions). Any non-active account
   * (disabled / deleted / is_active false) is blocked. Trusts the JWT only
   * for identity (`sub`).
   */
  app.decorate(
    "requireActiveAccount",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sub = request.user?.sub;
      if (!sub) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid or missing token",
        });
      }

      const user = await prisma.authUser.findUnique({
        where: { publicId: sub },
        select: { isActive: true, accountStatus: true },
      });

      if (!user) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "User not found",
        });
      }

      if (isBlockedAccount(user.isActive, user.accountStatus)) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Account is disabled",
        });
      }

      if (!canCreateContent(user.isActive, user.accountStatus)) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Account is not active",
        });
      }
    },
  );
}

export const registerAuthPlugin = fp(authPlugin);

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...allowedRoles: string[]) => preHandlerHookHandler;
    requireActiveAccount: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; email: string; roles: string[] };
    user: { sub: string; email: string; roles: string[] };
  }
}

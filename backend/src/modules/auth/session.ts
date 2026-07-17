import type { FastifyReply } from "fastify";
import { ACCESS_TOKEN_TTL } from "./refresh-token.js";
import type { SessionContext, SessionResponse } from "./auth.types.js";

/**
 * Build the standard session response: a freshly signed access token, the
 * opaque refresh token, its TTL, and the minimal user object.
 *
 * Shared by the real login/refresh routes and the demo login routes so both
 * paths issue identical, real backend-signed JWTs (same claims, same secret).
 */
export async function buildSessionResponse(
  reply: FastifyReply,
  session: SessionContext,
): Promise<SessionResponse> {
  const accessToken = await reply.jwtSign(session.claims, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  return {
    accessToken,
    refreshToken: session.refreshToken,
    expiresIn: ACCESS_TOKEN_TTL,
    user: session.user,
  };
}

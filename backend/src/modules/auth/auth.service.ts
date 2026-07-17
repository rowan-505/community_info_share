import { Prisma } from "@prisma/client";
import { isBlockedAccount } from "../../shared/account-status.js";
import {
  authRepository,
  mapRoles,
  type AuthUserWithRoles,
} from "./auth.repository.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from "./refresh-token.js";
import type {
  AccessTokenClaims,
  AuthProfile,
  LoginInput,
  MinimalUser,
  RegisterInput,
  RequestMeta,
  SessionContext,
} from "./auth.types.js";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

function toAccessTokenClaims(user: AuthUserWithRoles): AccessTokenClaims {
  return {
    sub: user.publicId,
    email: user.email,
    roles: mapRoles(user),
  };
}

function toMinimalUser(user: AuthUserWithRoles): MinimalUser {
  return {
    id: user.id.toString(),
    public_id: user.publicId,
    email: user.email,
    display_name: user.displayName,
    roles: mapRoles(user),
  };
}

function toProfile(user: AuthUserWithRoles): AuthProfile {
  return {
    id: user.id.toString(),
    public_id: user.publicId,
    email: user.email,
    display_name: user.displayName,
    phone: user.phone ?? null,
    roles: mapRoles(user),
    email_verified: user.emailVerified,
    account_status: user.accountStatus,
    primary_region_id: user.primaryRegionId ? user.primaryRegionId.toString() : null,
    preferred_language: user.preferredLanguage,
  };
}

/**
 * Login / refresh / me gate.
 * Blocks any account that is not fully active: account_status "disabled"
 * (used for both Suspend and Ban) or "deleted", or is_active false.
 */
function assertUserUsable(user: AuthUserWithRoles): void {
  if (isBlockedAccount(user.isActive, user.accountStatus)) {
    throw new AuthError("Account is disabled", 403);
  }
}

async function issueSession(
  user: AuthUserWithRoles,
  meta: RequestMeta,
): Promise<SessionContext> {
  const refreshToken = generateRefreshToken();
  await authRepository.createSession({
    userId: user.id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiry(),
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  return {
    claims: toAccessTokenClaims(user),
    refreshToken,
    user: toMinimalUser(user),
  };
}

export const authService = {
  /**
   * Issue a real session (refresh token persisted + access-token claims) for an
   * already-resolved user. Used by the normal login/refresh paths (via `login`
   * / `refresh`) and reused by Demo Mode login so demo tokens are real JWTs.
   */
  issueSessionForUser(
    user: AuthUserWithRoles,
    meta: RequestMeta,
  ): Promise<SessionContext> {
    return issueSession(user, meta);
  },

  async register(input: RegisterInput): Promise<AuthProfile> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new AuthError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await authRepository.createPublicUser({
        email: input.email,
        passwordHash,
        displayName: input.displayName,
      });
      return toProfile(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AuthError("Email already registered", 409);
      }
      throw error;
    }
  },

  async login(input: LoginInput, meta: RequestMeta): Promise<SessionContext> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AuthError("Invalid email or password", 401);
    }

    assertUserUsable(user);

    const result = await verifyPassword(user.passwordHash, input.password);
    if (!result.valid) {
      throw new AuthError("Invalid email or password", 401);
    }

    if (result.needsRehash) {
      try {
        const upgraded = await hashPassword(input.password);
        await authRepository.updatePasswordHash(user.id, upgraded);
      } catch {
        // Best-effort upgrade: never block a successful login.
      }
    }

    await authRepository.touchLastLogin(user.id);

    return issueSession(user, meta);
  },

  async refresh(rawToken: string, meta: RequestMeta): Promise<SessionContext> {
    const tokenHash = hashRefreshToken(rawToken);
    const session = await authRepository.findActiveSessionByTokenHash(tokenHash);
    if (!session) {
      throw new AuthError("Invalid or expired refresh token", 401);
    }

    assertUserUsable(session.user);

    // Rotate: the presented token is consumed and a fresh session is issued.
    await authRepository.revokeSessionByTokenHash(tokenHash);

    return issueSession(session.user, meta);
  },

  async logout(rawToken: string): Promise<void> {
    // Idempotent: revoking an unknown/already-revoked token is a no-op.
    await authRepository.revokeSessionByTokenHash(hashRefreshToken(rawToken));
  },

  async getMe(publicId: string): Promise<AuthProfile> {
    const user = await authRepository.findProfileByPublicId(publicId);
    if (!user) {
      throw new AuthError("User not found", 401);
    }

    assertUserUsable(user);

    return toProfile(user);
  },
};

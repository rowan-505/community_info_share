import { createHash, randomBytes } from "node:crypto";

/** Access-token time-to-live. MUST match the CoreMap contract. */
export const ACCESS_TOKEN_TTL = "15m";

/** Refresh-token lifetime in days. */
export const REFRESH_TOKEN_TTL_DAYS = 30;

/**
 * Generate an opaque refresh token: 32 random bytes, base64url-encoded.
 * This raw token is returned to the client and is NEVER stored in the database.
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash a raw refresh token for storage. Only the SHA-256 hex digest is persisted
 * in app_auth.auth_sessions.refresh_token_hash.
 */
export function hashRefreshToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Compute the absolute expiry timestamp for a newly issued refresh token. */
export function refreshTokenExpiry(from: Date = new Date()): Date {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiry;
}

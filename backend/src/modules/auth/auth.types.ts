export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

/** Access-token claims. MUST match the CoreMap JWT contract exactly. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: string[];
}

/** Minimal user object returned by login / refresh. */
export interface MinimalUser {
  id: string;
  public_id: string;
  email: string;
  display_name: string;
  roles: string[];
}

/** Full profile returned by register / GET /auth/me. */
export interface AuthProfile {
  id: string;
  public_id: string;
  email: string;
  display_name: string;
  phone: string | null;
  roles: string[];
  email_verified: boolean;
  account_status: string;
  primary_region_id: string | null;
  preferred_language: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: MinimalUser;
}

export interface SessionContext {
  claims: AccessTokenClaims;
  refreshToken: string;
  user: MinimalUser;
}

export interface RequestMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

import { clearTokens, getRefreshToken, setTokens } from "../auth/tokenStorage";
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  SessionResponse,
} from "../types/auth";
import { request } from "./client";

export const authApi = {
  register(input: RegisterInput): Promise<RegisterResponse> {
    return request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async login(input: LoginInput): Promise<AuthUser> {
    const session = await request<SessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setTokens(session.accessToken, session.refreshToken);
    return session.user;
  },

  me(): Promise<AuthUser> {
    return request<AuthUser>("/auth/me", { auth: "required" });
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await request<{ message: string }>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      clearTokens();
    }
  },
};

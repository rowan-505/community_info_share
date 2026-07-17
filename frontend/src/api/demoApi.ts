import { setTokens } from "../auth/tokenStorage";
import type { AuthUser, SessionResponse } from "../types/auth";
import type { CommunityPost } from "../types/post";
import { request, type ApiResponse } from "./client";

export interface DemoStatusUser {
  key: string;
  email: string;
  displayName: string;
  roleCode: string;
}

export interface DemoStatus {
  enabled: boolean;
  users: DemoStatusUser[];
}

export interface DemoResetResult {
  demoUserCount: number;
  postsDeleted: number;
  reactionsDeleted: number;
  notificationsDeleted: number;
  sessionsDeleted: number;
}

async function loginAs(path: string): Promise<AuthUser> {
  const session = await request<SessionResponse>(path, { method: "POST" });
  setTokens(session.accessToken, session.refreshToken);
  return session.user;
}

export const demoApi = {
  status(): Promise<DemoStatus> {
    return request<DemoStatus>("/demo/status");
  },

  loginUser(): Promise<AuthUser> {
    return loginAs("/demo/login/user");
  },

  loginReactor(): Promise<AuthUser> {
    return loginAs("/demo/login/reactor");
  },

  loginAdmin(): Promise<AuthUser> {
    return loginAs("/demo/login/admin");
  },

  createPost(): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>("/demo/create-post", {
      method: "POST",
    }).then((res) => res.data);
  },

  runFull(): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>("/demo/run-full", {
      method: "POST",
    }).then((res) => res.data);
  },

  reset(): Promise<DemoResetResult> {
    return request<ApiResponse<DemoResetResult>>("/demo/reset", {
      method: "POST",
    }).then((res) => res.data);
  },
};

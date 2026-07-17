import { request, type ApiResponse } from "./client";

export interface ModeratedUser {
  publicId: string;
  email: string;
  displayName: string;
  accountStatus: string;
  isActive: boolean;
  roles: string[];
  postCount: number;
}

export const adminUsersApi = {
  getUsers(): Promise<ModeratedUser[]> {
    return request<ApiResponse<ModeratedUser[]>>("/admin/users", {
      auth: "required",
    }).then((res) => res.data);
  },

  suspend(publicId: string): Promise<ModeratedUser> {
    return request<ApiResponse<ModeratedUser>>(
      `/admin/users/${publicId}/suspend`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },

  ban(publicId: string): Promise<ModeratedUser> {
    return request<ApiResponse<ModeratedUser>>(`/admin/users/${publicId}/ban`, {
      method: "POST",
      auth: "required",
    }).then((res) => res.data);
  },

  unban(publicId: string): Promise<ModeratedUser> {
    return request<ApiResponse<ModeratedUser>>(
      `/admin/users/${publicId}/unban`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },
};

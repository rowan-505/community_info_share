import type { CommunityPost } from "../types/post";
import { request, type ApiResponse } from "./client";

export const adminReviewApi = {
  getPosts(): Promise<CommunityPost[]> {
    return request<ApiResponse<CommunityPost[]>>("/admin/community/posts", {
      auth: "required",
    }).then((res) => res.data);
  },

  verify(publicId: string): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>(
      `/admin/community/posts/${publicId}/verify`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },

  unverify(publicId: string): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>(
      `/admin/community/posts/${publicId}/unverify`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },

  reject(publicId: string): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>(
      `/admin/community/posts/${publicId}/reject`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },

  resolve(publicId: string): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>(
      `/admin/community/posts/${publicId}/resolve`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },

  expire(publicId: string): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>(
      `/admin/community/posts/${publicId}/expire`,
      { method: "POST", auth: "required" },
    ).then((res) => res.data);
  },
};

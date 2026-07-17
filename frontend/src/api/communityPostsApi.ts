import type { CommunityPost, CreatePostInput, PostReactions } from "../types/post";
import { request, type ApiResponse } from "./client";

export const communityPostsApi = {
  getFreeBoardPosts(): Promise<CommunityPost[]> {
    return request<ApiResponse<CommunityPost[]>>("/community/posts/free-board").then(
      (res) => res.data,
    );
  },

  getReliableBoardPosts(): Promise<CommunityPost[]> {
    return request<ApiResponse<CommunityPost[]>>("/community/posts/reliable-board").then(
      (res) => res.data,
    );
  },

  createPost(input: CreatePostInput): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>("/community/posts", {
      method: "POST",
      auth: "required",
      body: JSON.stringify(input),
    }).then((res) => res.data);
  },

  addReaction(publicId: string, reactionType: keyof PostReactions): Promise<CommunityPost> {
    return request<ApiResponse<CommunityPost>>(`/community/posts/${publicId}/reactions`, {
      method: "POST",
      auth: "required",
      body: JSON.stringify({ reactionType }),
    }).then((res) => res.data);
  },
};

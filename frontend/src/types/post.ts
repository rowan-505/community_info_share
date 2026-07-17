export type PostStatus =
  | "free_board"
  | "community_confirmed"
  | "admin_verified"
  | "rejected"
  | "resolved"
  | "expired";

export interface PostReactions {
  confirm: number;
  useful: number;
  fake: number;
  resolved: number;
}

export interface CommunityPost {
  id: string;
  publicId: string;
  title: string;
  topic: string;
  description: string;
  authorName: string;
  status: PostStatus;
  trustScore: number;
  createdAt: string;
  reactions?: PostReactions;
}

export const defaultReactions: PostReactions = {
  confirm: 0,
  useful: 0,
  fake: 0,
  resolved: 0,
};

export type ViewName =
  | "free"
  | "reliable"
  | "create"
  | "admin"
  | "auth"
  | "notifications";

export interface CreatePostInput {
  title: string;
  description: string;
  topic: string;
}

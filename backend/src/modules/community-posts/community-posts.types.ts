export type PostStatus =
  | "free_board"
  | "community_confirmed"
  | "admin_verified"
  | "rejected"
  | "resolved"
  | "expired";

export type ReactionType = "confirm" | "useful" | "fake" | "resolved";

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
  description: string;
  topic: string;
  authorName: string;
  status: PostStatus;
  trustScore: number;
  createdAt: string;
  reactions: PostReactions;
}

export interface CreateCommunityPostInput {
  title: string;
  description: string;
  topic: string;
}

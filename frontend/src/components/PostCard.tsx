import type { ReactNode } from "react";
import type { CommunityPost, PostReactions } from "../types/post";
import { ReactionButtons } from "./ReactionButtons";
import { defaultReactions } from "../types/post";

interface PostCardProps {
  post: CommunityPost;
  showReactions?: boolean;
  onReact?: (postId: string, type: keyof PostReactions) => void;
  adminActions?: ReactNode;
  disabled?: boolean;
}

export function PostCard({
  post,
  showReactions = false,
  onReact,
  adminActions,
  disabled = false,
}: PostCardProps) {
  const reactions = post.reactions ?? defaultReactions;

  return (
    <article className="post-card">
      <h3>{post.title}</h3>
      <p className="post-meta">
        <span>Topic: {post.topic}</span>
        <span>Author: {post.authorName}</span>
      </p>
      <p className="post-description">{post.description}</p>
      <p className="post-meta">
        <span>Status: {post.status}</span>
        <span>Trust score: {post.trustScore}</span>
      </p>

      {showReactions && onReact && (
        <ReactionButtons
          reactions={reactions}
          onReact={(type) => onReact(post.publicId, type)}
          disabled={disabled}
        />
      )}

      {adminActions && <div className="admin-actions">{adminActions}</div>}
    </article>
  );
}

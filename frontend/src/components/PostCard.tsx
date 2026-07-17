import type { ReactNode } from "react";
import type { CommunityPost, PostReactions, PostStatus } from "../types/post";
import { ReactionButtons } from "./ReactionButtons";
import { defaultReactions } from "../types/post";

interface PostCardProps {
  post: CommunityPost;
  showReactions?: boolean;
  onReact?: (postId: string, type: keyof PostReactions) => void;
  adminActions?: ReactNode;
  disabled?: boolean;
  boardLabel?: string;
}

const statusLabels: Record<PostStatus, string> = {
  free_board: "Free Board",
  community_confirmed: "Community Confirmed",
  admin_verified: "Admin Verified",
  rejected: "Rejected",
  resolved: "Resolved",
  expired: "Expired",
};

const statusClasses: Record<PostStatus, string> = {
  free_board: "badge-status-free",
  community_confirmed: "badge-status-confirmed",
  admin_verified: "badge-status-verified",
  rejected: "badge-status-rejected",
  resolved: "badge-status-resolved",
  expired: "badge-status-expired",
};

export function PostCard({
  post,
  showReactions = false,
  onReact,
  adminActions,
  disabled = false,
  boardLabel,
}: PostCardProps) {
  const reactions = post.reactions ?? defaultReactions;

  return (
    <article className="post-card community-post-card">
      <div className="post-card-header">
        <div className="post-title-group">
          {boardLabel && <span className="board-label">{boardLabel}</span>}
          <h3 className="post-title">{post.title}</h3>
        </div>
        <span className="badge topic-badge">{post.topic}</span>
      </div>

      <p className="post-meta">
        <span>Posted by {post.authorName}</span>
      </p>

      <p className="post-description">{post.description}</p>

      <div className="post-card-footer">
        <div className="post-badges" aria-label="Post status">
          <span className={`badge badge-status ${statusClasses[post.status]}`}>
            {statusLabels[post.status]}
          </span>
          <span className="badge trust-badge">
            Trust score {post.trustScore}
          </span>
        </div>

        <ReactionButtons
          reactions={reactions}
          onReact={
            showReactions && onReact
              ? (type) => onReact(post.publicId, type)
              : undefined
          }
          disabled={disabled}
          readonly={!showReactions || !onReact}
        />
      </div>

      {adminActions && <div className="admin-actions">{adminActions}</div>}
    </article>
  );
}

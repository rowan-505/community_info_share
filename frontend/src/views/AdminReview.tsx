import { useEffect, useState } from "react";
import { adminReviewApi } from "../api/adminReviewApi";
import { adminUsersApi, type ModeratedUser } from "../api/adminUsersApi";
import { PostCard } from "../components/PostCard";
import type { AuthUser } from "../types/auth";
import type { CommunityPost } from "../types/post";

const REVIEWER_ROLES = new Set(["admin", "super_admin"]);

interface AdminReviewProps {
  user: AuthUser | null;
}

export function AdminReview({ user }: AdminReviewProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<ModeratedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnPostId, setActingOnPostId] = useState<string | null>(null);
  const [actingOnUserId, setActingOnUserId] = useState<string | null>(null);

  const canReview = user && user.roles.some((role) => REVIEWER_ROLES.has(role));

  useEffect(() => {
    if (!canReview) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [postData, userData] = await Promise.all([
          adminReviewApi.getPosts(),
          adminUsersApi.getUsers(),
        ]);
        if (!cancelled) {
          setPosts(postData);
          setUsers(userData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load admin data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [canReview]);

  async function handlePostAction(
    publicId: string,
    action: "verify" | "reject" | "resolve" | "expire",
  ) {
    setActingOnPostId(publicId);
    setError(null);

    try {
      const updatedPost = await adminReviewApi[action](publicId);
      setPosts((prev) =>
        prev.map((post) => (post.publicId === publicId ? updatedPost : post)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActingOnPostId(null);
    }
  }

  async function handleUserAction(
    publicId: string,
    action: "suspend" | "ban" | "unban",
  ) {
    setActingOnUserId(publicId);
    setError(null);

    try {
      const updated = await adminUsersApi[action](publicId);
      setUsers((prev) =>
        prev.map((item) => (item.publicId === publicId ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Moderation action failed");
    } finally {
      setActingOnUserId(null);
    }
  }

  if (!user) {
    return (
      <section className="view">
        <h2>Admin Review</h2>
        <p className="error-message">You must be logged in to access admin review.</p>
      </section>
    );
  }

  if (!canReview) {
    return (
      <section className="view">
        <h2>Admin Review</h2>
        <p className="error-message">
          Admin or super_admin role required. Your roles: {user.roles.join(", ") || "none"}
        </p>
      </section>
    );
  }

  if (loading) return <p className="status-message">Loading admin data...</p>;

  return (
    <section className="view">
      <h2>Admin Review</h2>
      <p className="view-note">
        Review community posts and moderate users. Logged in as {user.display_name} (
        {user.roles.join(", ")}).
      </p>
      {error && <p className="error-message">{error}</p>}

      <h3>User Moderation</h3>
      <p className="view-note">
        Suspend: can log in, cannot post/react. Ban: cannot log in. Unban: restore to active.
      </p>
      {users.length === 0 && <p>No community users to moderate yet.</p>}
      {users.map((item) => (
        <article key={item.publicId} className="notification-card">
          <h3>{item.displayName}</h3>
          <p className="post-meta">
            <span>{item.email}</span>
            <span>Status: {item.accountStatus}</span>
            <span>Posts: {item.postCount}</span>
            <span>Roles: {item.roles.join(", ") || "none"}</span>
          </p>
          <div className="admin-actions">
            <button
              type="button"
              className="btn btn-small"
              disabled={actingOnUserId === item.publicId || item.publicId === user.public_id}
              onClick={() => handleUserAction(item.publicId, "suspend")}
            >
              Suspend
            </button>
            <button
              type="button"
              className="btn btn-small"
              disabled={actingOnUserId === item.publicId || item.publicId === user.public_id}
              onClick={() => handleUserAction(item.publicId, "ban")}
            >
              Ban
            </button>
            <button
              type="button"
              className="btn btn-small"
              disabled={actingOnUserId === item.publicId || item.publicId === user.public_id}
              onClick={() => handleUserAction(item.publicId, "unban")}
            >
              Unban
            </button>
          </div>
        </article>
      ))}

      <h3>Post Review</h3>
      {posts.length === 0 && <p>No posts to review.</p>}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          disabled={actingOnPostId === post.publicId}
          adminActions={
            <>
              <button
                type="button"
                className="btn btn-small"
                disabled={actingOnPostId === post.publicId}
                onClick={() => handlePostAction(post.publicId, "verify")}
              >
                Verify
              </button>
              <button
                type="button"
                className="btn btn-small"
                disabled={actingOnPostId === post.publicId}
                onClick={() => handlePostAction(post.publicId, "reject")}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn btn-small"
                disabled={actingOnPostId === post.publicId}
                onClick={() => handlePostAction(post.publicId, "resolve")}
              >
                Resolve
              </button>
              <button
                type="button"
                className="btn btn-small"
                disabled={actingOnPostId === post.publicId}
                onClick={() => handlePostAction(post.publicId, "expire")}
              >
                Expire
              </button>
            </>
          }
        />
      ))}
    </section>
  );
}

import { useEffect, useState } from "react";
import { adminReviewApi } from "../api/adminReviewApi";
import { adminUsersApi, type ModeratedUser } from "../api/adminUsersApi";
import { PostCard } from "../components/PostCard";
import type { AuthUser } from "../types/auth";
import type { CommunityPost } from "../types/post";

const REVIEWER_ROLES = new Set(["admin", "super_admin"]);

/**
 * The shared CoreMap auth table only allows account_status values
 * active | disabled | deleted. Suspend and Ban both store "disabled"
 * (Ban also sets isActive false), so display those values honestly.
 */
function statusLabel(item: ModeratedUser): string {
  if (item.accountStatus === "active") return "Active";
  if (item.accountStatus === "deleted") return "Deleted";
  return item.isActive ? "Disabled (suspended)" : "Disabled (banned)";
}

function statusBadgeClass(item: ModeratedUser): string {
  if (item.accountStatus === "active") return "badge-success";
  if (item.accountStatus === "deleted") return "badge-status-expired";
  return item.isActive ? "badge-warning" : "badge-danger";
}

function roleLabel(role: string): string {
  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type PostAction = "verify" | "unverify" | "reject" | "resolve" | "expire";

interface AdminReviewProps {
  user: AuthUser | null;
  onPostsChanged?: () => void;
}

export function AdminReview({ user, onPostsChanged }: AdminReviewProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<ModeratedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  async function handlePostAction(publicId: string, action: PostAction) {
    setActingOnPostId(publicId);
    setError(null);
    setSuccess(null);

    try {
      const updatedPost = await adminReviewApi[action](publicId);
      setPosts((prev) =>
        prev.map((post) => (post.publicId === publicId ? updatedPost : post)),
      );
      const labels: Record<PostAction, string> = {
        verify: "verified",
        unverify: "unverified",
        reject: "rejected",
        resolve: "resolved",
        expire: "expired",
      };
      setSuccess(`Post ${labels[action]} successfully.`);
      onPostsChanged?.();
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
    setSuccess(null);

    try {
      const updated = await adminUsersApi[action](publicId);
      setUsers((prev) =>
        prev.map((item) => (item.publicId === publicId ? updated : item)),
      );
      setSuccess(`User ${action} successful.`);
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
        <p className="alert alert-error">
          You must be logged in to access admin review.
        </p>
      </section>
    );
  }

  if (!canReview) {
    return (
      <section className="view">
        <h2>Admin Review</h2>
        <p className="alert alert-error">
          Admin or super_admin role required. Your roles: {user.roles.join(", ") || "none"}
        </p>
      </section>
    );
  }

  if (loading) {
    return <p className="status-message alert">Loading admin data...</p>;
  }

  const primaryRole = user.roles.find((role) => REVIEWER_ROLES.has(role)) ?? user.roles[0] ?? "none";

  return (
    <section className="view admin-review-view">
      <div className="section-header admin-review-header">
        <div>
          <h2>Admin Review</h2>
          <p className="view-note">
            Review community posts, verify reliable information, and manage users.
          </p>
        </div>
        <span className="badge badge-status admin-role-badge">
          Logged in as {user.display_name} · Role: {roleLabel(primaryRole)}
        </span>
      </div>

      {error && <p className="alert alert-error">{error}</p>}
      {success && <p className="alert alert-success">{success}</p>}

      <section className="admin-section" aria-labelledby="user-moderation-title">
        <div className="section-header admin-section-header">
          <div>
            <h3 id="user-moderation-title">User Moderation</h3>
            <p className="view-note">
              Review account status, roles, and posting activity.
            </p>
          </div>
        </div>

        {users.length === 0 && (
          <div className="card empty-state admin-empty-state">
            <h3>No users to moderate.</h3>
          </div>
        )}

        <div className="admin-user-grid">
          {users.map((item) => (
            <article key={item.publicId} className="card admin-user-card">
              <div className="admin-card-header">
                <div>
                  <h3>{item.displayName}</h3>
                  <p className="admin-user-email">{item.email}</p>
                </div>
                <span className={`badge ${statusBadgeClass(item)}`}>
                  {statusLabel(item)}
                </span>
              </div>

              <div className="admin-user-meta">
                <span className="badge">Posts: {item.postCount}</span>
                {(item.roles.length > 0 ? item.roles : ["none"]).map((role) => (
                  <span key={role} className="badge badge-status">
                    {roleLabel(role)}
                  </span>
                ))}
              </div>

              <div className="admin-actions admin-user-actions">
                <button
                  type="button"
                  className="button button-secondary btn-small admin-action-warning"
                  disabled={actingOnUserId === item.publicId || item.publicId === user.public_id}
                  onClick={() => handleUserAction(item.publicId, "suspend")}
                >
                  Suspend
                </button>
                <button
                  type="button"
                  className="button button-danger btn-small"
                  disabled={actingOnUserId === item.publicId || item.publicId === user.public_id}
                  onClick={() => handleUserAction(item.publicId, "ban")}
                >
                  Ban
                </button>
                <button
                  type="button"
                  className="button button-primary btn-small admin-action-success"
                  disabled={actingOnUserId === item.publicId || item.publicId === user.public_id}
                  onClick={() => handleUserAction(item.publicId, "unban")}
                >
                  Unban
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="post-review-title">
        <div className="section-header admin-section-header">
          <div>
            <h3 id="post-review-title">Post Review</h3>
            <p className="view-note">
              Verify, reject, resolve, or expire community reports.
            </p>
          </div>
        </div>

        {posts.length === 0 && (
          <div className="card empty-state admin-empty-state">
            <h3>No posts to review.</h3>
          </div>
        )}

        <div className="admin-post-list">
          {posts.map((post) => {
            const isVerified = post.status === "admin_verified";
            const busy = actingOnPostId === post.publicId;

            return (
              <PostCard
                key={post.id}
                post={post}
                disabled={busy}
                boardLabel="Post Review"
                adminActions={
                  <>
                    {isVerified ? (
                      <button
                        type="button"
                        className="button button-secondary btn-small"
                        disabled={busy}
                        onClick={() => handlePostAction(post.publicId, "unverify")}
                      >
                        Unverify
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button button-primary btn-small"
                        disabled={busy}
                        onClick={() => handlePostAction(post.publicId, "verify")}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      type="button"
                      className="button button-danger btn-small"
                      disabled={busy}
                      onClick={() => handlePostAction(post.publicId, "reject")}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="button button-secondary btn-small admin-action-success"
                      disabled={busy}
                      onClick={() => handlePostAction(post.publicId, "resolve")}
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      className="button button-secondary btn-small"
                      disabled={busy}
                      onClick={() => handlePostAction(post.publicId, "expire")}
                    >
                      Expire
                    </button>
                  </>
                }
              />
            );
          })}
        </div>
      </section>
    </section>
  );
}

import { useEffect, useState } from "react";
import { communityPostsApi } from "../api/communityPostsApi";
import { PostCard } from "../components/PostCard";
import type { CommunityPost } from "../types/post";

interface ReliableBoardProps {
  refreshKey: number;
}

export function ReliableBoard({ refreshKey }: ReliableBoardProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const data = await communityPostsApi.getReliableBoardPosts();
        if (!cancelled) {
          setPosts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load posts");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) return <p className="status-message alert">Loading posts...</p>;
  if (error) return <p className="alert alert-error">{error}</p>;

  return (
    <section className="view">
      <h2>Reliable Board</h2>
      <p className="view-note">
        Posts marked Community Confirmed or Admin Verified by the API.
      </p>
      {posts.length === 0 && (
        <div className="card empty-state post-empty-state">
          <h3>No posts yet</h3>
          <p>Create a post or run the demo flow.</p>
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} boardLabel="Reliable Board" />
      ))}
    </section>
  );
}

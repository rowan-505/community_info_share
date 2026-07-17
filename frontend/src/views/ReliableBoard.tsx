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

  if (loading) return <p className="status-message">Loading posts...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <section className="view">
      <h2>Reliable Board</h2>
      <p className="view-note">
        Posts with community_confirmed or admin_verified status from the API.
      </p>
      {posts.length === 0 && <p>No reliable posts yet.</p>}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}

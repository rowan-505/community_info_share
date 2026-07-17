import { useEffect, useState } from "react";
import { communityPostsApi } from "../api/communityPostsApi";
import { PostCard } from "../components/PostCard";
import type { CommunityPost, PostReactions } from "../types/post";

interface FreeBoardProps {
  refreshKey: number;
}

export function FreeBoard({ refreshKey }: FreeBoardProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const data = await communityPostsApi.getFreeBoardPosts();
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

  async function handleReact(publicId: string, type: keyof PostReactions) {
    setReactingPostId(publicId);
    setError(null);

    try {
      const updatedPost = await communityPostsApi.addReaction(publicId, type);
      setPosts((prev) =>
        prev.map((post) => (post.publicId === publicId ? updatedPost : post)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reaction");
    } finally {
      setReactingPostId(null);
    }
  }

  if (loading) return <p className="status-message alert">Loading posts...</p>;

  return (
    <section className="view">
      <h2>Free Board</h2>
      <p className="view-note">
        Reactions are saved to the API. You must be logged in to react.
      </p>
      {error && <p className="alert alert-error">{error}</p>}
      {posts.length === 0 && (
        <div className="card empty-state post-empty-state">
          <h3>No posts yet</h3>
          <p>Create a post or run the demo flow.</p>
        </div>
      )}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          showReactions
          onReact={(postId, type) => handleReact(postId, type)}
          disabled={reactingPostId === post.publicId}
        />
      ))}
    </section>
  );
}

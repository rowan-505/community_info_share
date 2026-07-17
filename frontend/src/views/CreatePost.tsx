import { useState } from "react";
import { communityPostsApi } from "../api/communityPostsApi";
import { CreatePostForm } from "../components/CreatePostForm";
import type { CreatePostInput } from "../types/post";

interface CreatePostProps {
  onCreated: () => void;
}

export function CreatePost({ onCreated }: CreatePostProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: CreatePostInput) {
    setLoading(true);
    setError(null);

    try {
      await communityPostsApi.createPost(input);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="view">
      <h2>Create Post</h2>
      <p className="view-note">New posts are sent to the backend API.</p>
      {error && <p className="error-message">{error}</p>}
      <CreatePostForm onSubmit={handleSubmit} submitting={loading} />
    </section>
  );
}

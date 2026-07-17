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
    <section className="view create-post-view">
      <div className="card create-post-card">
        <div className="create-post-header">
          <h2>Create Community Post</h2>
          <p className="view-note">
            Share local updates, safety alerts, transport changes, or public
            information.
          </p>
        </div>
        {error && <p className="alert alert-error">{error}</p>}
        <CreatePostForm onSubmit={handleSubmit} submitting={loading} />
      </div>
    </section>
  );
}

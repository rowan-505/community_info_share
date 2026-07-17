import { useState, type FormEvent } from "react";
import type { CreatePostInput } from "../types/post";

interface CreatePostFormProps {
  onSubmit: (input: CreatePostInput) => void | Promise<void>;
  submitting?: boolean;
}

export function CreatePostForm({ onSubmit, submitting = false }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !topic.trim()) return;

    await onSubmit({ title, description, topic });
    setTitle("");
    setDescription("");
    setTopic("");
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={submitting}
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          disabled={submitting}
        />
      </label>
      <label>
        Topic
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          disabled={submitting}
        />
      </label>
      <button type="submit" className="btn" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

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
    <form className="create-form create-post-form" onSubmit={handleSubmit}>
      <label className="form-group">
        <span>Title</span>
        <input
          className="input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Example: Heavy rain near local market"
          required
          disabled={submitting}
        />
        <span className="form-helper">
          Use a short headline that helps neighbors scan the update quickly.
        </span>
      </label>
      <label className="form-group">
        <span>Description</span>
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened, where it happened, and what people should know."
          rows={5}
          required
          disabled={submitting}
        />
        <span className="form-helper">
          Include the location, timing, and any action people should take.
        </span>
      </label>
      <label className="form-group">
        <span>Topic</span>
        <input
          className="input"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="safety, transport, event, weather, lost-found, announcement"
          required
          disabled={submitting}
        />
        <span className="form-helper">
          Choose one clear category or a short tag.
        </span>
      </label>
      <button
        type="submit"
        className="button button-primary create-submit-button"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

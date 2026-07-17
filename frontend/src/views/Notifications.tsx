import { useEffect, useState } from "react";
import {
  notificationsApi,
  type Notification,
} from "../api/notificationsApi";
import type { AuthUser } from "../types/auth";

interface NotificationsProps {
  user: AuthUser | null;
}

/** Simple relative time for the notification list (no external date library). */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function Notifications({ user }: NotificationsProps) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await notificationsApi.getNotifications();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load notifications");
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
  }, [user]);

  async function handleMarkRead(publicId: string) {
    setError(null);

    try {
      const updated = await notificationsApi.markAsRead(publicId);
      setItems((prev) =>
        prev.map((item) => (item.publicId === publicId ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }

  if (!user) {
    return (
      <section className="view">
        <h2>Notifications</h2>
        <p className="error-message">You must be logged in to view notifications.</p>
      </section>
    );
  }

  if (loading) return <p className="status-message">Loading notifications...</p>;

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <section className="view">
      <h2>Notifications</h2>
      <p className="view-note">
        In-app notifications for your posts. Unread: {unreadCount}
      </p>
      {error && <p className="error-message">{error}</p>}
      {items.length === 0 && <p>No notifications yet.</p>}
      {items.map((item) => (
        <article
          key={item.publicId}
          className={`notification-card ${item.isRead ? "notification-read" : ""}`}
        >
          <h3>{item.title}</h3>
          <p>{item.message}</p>
          <p className="post-meta">
            <span>Type: {item.type}</span>
            <span title={new Date(item.createdAt).toLocaleString()}>
              {relativeTime(item.createdAt)}
            </span>
          </p>
          {!item.isRead && (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => handleMarkRead(item.publicId)}
            >
              Mark as read
            </button>
          )}
        </article>
      ))}
    </section>
  );
}

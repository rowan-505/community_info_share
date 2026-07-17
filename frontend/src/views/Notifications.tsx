import { useEffect, useState } from "react";
import {
  notificationsApi,
  type Notification,
} from "../api/notificationsApi";
import type { AuthUser } from "../types/auth";

interface NotificationsProps {
  user: AuthUser | null;
  onUnreadCountChange?: (count: number) => void;
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

function formatLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Notifications({
  user,
  onUnreadCountChange,
}: NotificationsProps) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      onUnreadCountChange?.(0);
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
          onUnreadCountChange?.(data.filter((item) => !item.isRead).length);
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
  }, [user, onUnreadCountChange]);

  async function handleMarkRead(publicId: string) {
    setError(null);

    try {
      const updated = await notificationsApi.markAsRead(publicId);
      setItems((prev) => {
        const next = prev.map((item) =>
          item.publicId === publicId ? updated : item,
        );
        onUnreadCountChange?.(next.filter((item) => !item.isRead).length);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }

  if (!user) {
    return (
      <section className="view">
        <h2>Notifications</h2>
        <p className="alert alert-error">
          You must be logged in to view notifications.
        </p>
      </section>
    );
  }

  if (loading) {
    return <p className="status-message alert">Loading notifications...</p>;
  }

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <section className="view notifications-view">
      <div className="section-header notifications-header">
        <div>
          <h2>Notifications</h2>
          <p className="view-note">
            In-app updates for your posts and review activity.
          </p>
        </div>
        <span className="badge badge-status notification-unread-badge">
          Unread: {unreadCount}
        </span>
      </div>

      <p className="alert notification-helper">
        Notifications are account-specific. Switch to Demo User to see
        notifications for uploaded posts.
      </p>

      {error && <p className="alert alert-error">{error}</p>}
      {items.length === 0 && (
        <div className="card empty-state notification-empty-state">
          <h3>No notifications yet</h3>
          <p>React to a post or verify a post to create notifications.</p>
        </div>
      )}
      {items.map((item) => (
        <article
          key={item.publicId}
          className={`notification-card ${
            item.isRead ? "notification-read" : "notification-unread"
          }`}
        >
          <div className="notification-card-header">
            {!item.isRead && <span className="unread-dot" aria-label="Unread" />}
            <div className="notification-content">
              <h3>{item.title}</h3>
              <p className="notification-message">{item.message}</p>
            </div>
          </div>

          <div className="notification-meta">
            <span className="badge badge-status">
              {formatLabel(item.type)}
            </span>
            {item.reactionType && (
              <span className="badge badge-warning">
                Reaction: {formatLabel(item.reactionType)}
              </span>
            )}
            <span
              className="badge"
              title={new Date(item.createdAt).toLocaleString()}
            >
              {relativeTime(item.createdAt)}
            </span>
            <span
              className={`badge ${item.isRead ? "" : "badge-success"}`}
            >
              {item.isRead ? "Read" : "Unread"}
            </span>
          </div>

          {!item.isRead && (
            <div className="notification-actions">
              <button
                type="button"
                className="button button-secondary btn-small"
                onClick={() => handleMarkRead(item.publicId)}
              >
                Mark as read
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

import { useEffect, useState } from "react";
import { demoApi, type DemoStatus } from "../api/demoApi";
import type { AuthUser } from "../types/auth";

interface DemoToolbarProps {
  user: AuthUser | null;
  onAuthenticated: (user: AuthUser) => void;
  onDemoDataChanged: () => void;
}

const DEMO_ACCOUNT_LABELS: Record<string, string> = {
  "demo.user@coremap.local": "User",
  "demo.reactor@coremap.local": "Reactor",
  "demo.admin@coremap.local": "Admin",
};

export function DemoToolbar({
  user,
  onAuthenticated,
  onDemoDataChanged,
}: DemoToolbarProps) {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoApi
      .status()
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        // /demo/status is only registered when Demo Mode is on; a 404 here just
        // means the panel should stay hidden.
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.enabled) {
    return null;
  }

  const currentDemoAccount = user
    ? (DEMO_ACCOUNT_LABELS[user.email] ?? null)
    : null;

  async function run(action: () => Promise<void>, successMessage: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo action failed");
    } finally {
      setBusy(false);
    }
  }

  function switchAccount(login: () => Promise<AuthUser>, label: string) {
    void run(async () => {
      const nextUser = await login();
      onAuthenticated(nextUser);
    }, `Switched to Demo ${label}`);
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Reset demo data? This deletes ONLY demo-created posts, their reactions, demo notifications, and demo sessions. Real users and real posts are never touched.",
    );
    if (!confirmed) return;
    void run(async () => {
      const result = await demoApi.reset();
      onDemoDataChanged();
      setMessage(
        `Demo data reset: ${result.postsDeleted} post(s), ${result.reactionsDeleted} reaction(s), ${result.notificationsDeleted} notification(s) removed.`,
      );
    }, "Demo data reset");
  }

  return (
    <section className="demo-toolbar" aria-label="Showcase Demo Mode">
      <div className="demo-toolbar-head">
        <div>
          <strong>Showcase Demo Mode</strong>
          <p className="demo-hint">
            Notifications are account-specific. Switch to Demo User to see
            uploader notifications.
          </p>
        </div>
        <span className="demo-current badge badge-warning">
          Current demo account: {currentDemoAccount ?? "none"}
        </span>
      </div>
      <div className="demo-toolbar-actions">
        <button
          type="button"
          className="button button-secondary btn-small"
          disabled={busy}
          onClick={() => switchAccount(demoApi.loginUser, "User")}
        >
          Use Demo User
        </button>
        <button
          type="button"
          className="button button-secondary btn-small"
          disabled={busy}
          onClick={() => switchAccount(demoApi.loginReactor, "Reactor")}
        >
          Use Demo Reactor
        </button>
        <button
          type="button"
          className="button button-secondary btn-small"
          disabled={busy}
          onClick={() => switchAccount(demoApi.loginAdmin, "Admin")}
        >
          Use Demo Admin
        </button>
        <button
          type="button"
          className="button button-secondary btn-small"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await demoApi.createPost();
              onDemoDataChanged();
            }, "Demo post created in Free Board")
          }
        >
          Create Demo Post
        </button>
        <button
          type="button"
          className="button button-secondary btn-small"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await demoApi.runFull();
              onDemoDataChanged();
            }, "Full demo ran: post is Community Confirmed")
          }
        >
          Run Full Demo
        </button>
        <button
          type="button"
          className="button button-danger btn-small demo-danger"
          disabled={busy}
          onClick={handleReset}
        >
          Reset Demo Data
        </button>
      </div>
      {message && <p className="alert alert-success demo-msg">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}
    </section>
  );
}

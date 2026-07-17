import type { AuthUser } from "../types/auth";
import type { ViewName } from "../types/post";

interface NavHeaderProps {
  currentView: ViewName;
  user: AuthUser | null;
  unreadNotificationCount: number;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
}

export function NavHeader({
  currentView,
  user,
  unreadNotificationCount,
  onNavigate,
  onLogout,
}: NavHeaderProps) {
  const navItems: { view: ViewName; label: string }[] = [
    { view: "free", label: "Free Board" },
    { view: "reliable", label: "Reliable Board" },
    { view: "create", label: "Create Post" },
    {
      view: "notifications",
      label:
        user && unreadNotificationCount > 0
          ? `Notifications (${unreadNotificationCount})`
          : "Notifications",
    },
    { view: "admin", label: "Admin Review" },
  ];

  return (
    <header className="app-header nav-header">
      <div className="nav-top">
        <div className="app-heading">
          <h1 className="app-title">Community Info & News</h1>
          <p className="app-subtitle">
            Local posts, reactions, verification, and alerts.
          </p>
        </div>
        <div className="auth-status" aria-label="Login status">
          {user ? (
            <>
              <span className="auth-eyebrow">Signed in</span>
              <span className="auth-name">{user.display_name}</span>
              <button
                type="button"
                className="button button-ghost btn-small"
                onClick={onLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="auth-eyebrow">Guest mode</span>
              <button
                type="button"
                className={`button btn-small ${currentView === "auth" ? "button-primary" : "button-secondary"}`}
                onClick={() => onNavigate("auth")}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
      <nav className="nav-tabs" aria-label="Main navigation">
        {navItems.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            className={`nav-tab ${currentView === view ? "nav-tab-active" : ""}`}
            onClick={() => onNavigate(view)}
            aria-current={currentView === view ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}

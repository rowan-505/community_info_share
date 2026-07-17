import type { AuthUser } from "../types/auth";
import type { ViewName } from "../types/post";

interface NavHeaderProps {
  currentView: ViewName;
  user: AuthUser | null;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
}

const navItems: { view: ViewName; label: string }[] = [
  { view: "free", label: "Free Board" },
  { view: "reliable", label: "Reliable Board" },
  { view: "create", label: "Create Post" },
  { view: "notifications", label: "Notifications" },
  { view: "admin", label: "Admin Review" },
];

export function NavHeader({
  currentView,
  user,
  onNavigate,
  onLogout,
}: NavHeaderProps) {
  return (
    <header className="nav-header">
      <div className="nav-top">
        <h1>Community Info & News</h1>
        <div className="auth-status">
          {user ? (
            <>
              <span>Logged in as {user.display_name}</span>
              <button type="button" className="btn btn-small" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <span>Not logged in</span>
              <button
                type="button"
                className={`btn btn-small ${currentView === "auth" ? "btn-active" : ""}`}
                onClick={() => onNavigate("auth")}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
      <nav>
        {navItems.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            className={`btn ${currentView === view ? "btn-active" : ""}`}
            onClick={() => onNavigate(view)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}

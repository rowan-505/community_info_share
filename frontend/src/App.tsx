import { useCallback, useEffect, useState } from "react";
import { authApi } from "./api/authApi";
import { notificationsApi } from "./api/notificationsApi";
import { clearTokens, getAccessToken } from "./auth/tokenStorage";
import { DemoToolbar } from "./components/DemoToolbar";
import { NavHeader } from "./components/NavHeader";
import type { AuthUser } from "./types/auth";
import type { ViewName } from "./types/post";
import { AdminReview } from "./views/AdminReview";
import { AuthView } from "./views/AuthView";
import { CreatePost } from "./views/CreatePost";
import { FreeBoard } from "./views/FreeBoard";
import { Notifications } from "./views/Notifications";
import { ReliableBoard } from "./views/ReliableBoard";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<ViewName>("free");
  const [freeBoardRefreshKey, setFreeBoardRefreshKey] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const refreshUnreadCount = useCallback(async (nextUser: AuthUser | null) => {
    if (!nextUser) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const items = await notificationsApi.getNotifications();
      setUnreadNotificationCount(items.filter((item) => !item.isRead).length);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    authApi
      .me()
      .then(async (nextUser) => {
        setUser(nextUser);
        await refreshUnreadCount(nextUser);
      })
      .catch(() => clearTokens())
      .finally(() => setAuthLoading(false));
  }, [refreshUnreadCount]);

  function handlePostCreated() {
    setFreeBoardRefreshKey((key) => key + 1);
    setCurrentView("free");
  }

  function handleAuthenticated(nextUser: AuthUser) {
    setUser(nextUser);
    void refreshUnreadCount(nextUser);
    setCurrentView("free");
  }

  // Demo account switching updates auth state without forcing a view change, so
  // the presenter stays on whichever board/panel they are demonstrating.
  function handleDemoAuthenticated(nextUser: AuthUser) {
    setUser(nextUser);
    void refreshUnreadCount(nextUser);
  }

  // Bump the shared refresh key so both boards refetch after demo data changes.
  function handleDemoDataChanged() {
    setFreeBoardRefreshKey((key) => key + 1);
    void refreshUnreadCount(user);
  }

  function handlePostsChanged() {
    setFreeBoardRefreshKey((key) => key + 1);
    void refreshUnreadCount(user);
  }

  function handleLogout() {
    void authApi.logout();
    setUser(null);
    setUnreadNotificationCount(0);
    setCurrentView("free");
  }

  if (authLoading) {
    return <p className="status-message alert">Loading...</p>;
  }

  return (
    <div className="app app-shell app-container">
      <DemoToolbar
        user={user}
        onAuthenticated={handleDemoAuthenticated}
        onDemoDataChanged={handleDemoDataChanged}
      />
      <NavHeader
        currentView={currentView}
        user={user}
        unreadNotificationCount={unreadNotificationCount}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />
      <main>
        {currentView === "free" && (
          <FreeBoard refreshKey={freeBoardRefreshKey} />
        )}
        {currentView === "reliable" && (
          <ReliableBoard refreshKey={freeBoardRefreshKey} />
        )}
        {currentView === "create" &&
          (user ? (
            <CreatePost onCreated={handlePostCreated} />
          ) : (
            <section className="view">
              <h2>Create Post</h2>
              <p className="alert alert-error">
                You must be logged in to create a post.
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setCurrentView("auth")}
              >
                Go to Login
              </button>
            </section>
          ))}
        {currentView === "admin" && (
          <AdminReview user={user} onPostsChanged={handlePostsChanged} />
        )}
        {currentView === "notifications" && (
          <Notifications
            user={user}
            onUnreadCountChange={setUnreadNotificationCount}
          />
        )}
        {currentView === "auth" && (
          <AuthView onAuthenticated={handleAuthenticated} />
        )}
      </main>
    </div>
  );
}

export default App;

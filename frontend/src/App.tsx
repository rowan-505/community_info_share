import { useEffect, useState } from "react";
import { authApi } from "./api/authApi";
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

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setAuthLoading(false));
  }, []);

  function handlePostCreated() {
    setFreeBoardRefreshKey((key) => key + 1);
    setCurrentView("free");
  }

  function handleAuthenticated(nextUser: AuthUser) {
    setUser(nextUser);
    setCurrentView("free");
  }

  // Demo account switching updates auth state without forcing a view change, so
  // the presenter stays on whichever board/panel they are demonstrating.
  function handleDemoAuthenticated(nextUser: AuthUser) {
    setUser(nextUser);
  }

  // Bump the shared refresh key so both boards refetch after demo data changes.
  function handleDemoDataChanged() {
    setFreeBoardRefreshKey((key) => key + 1);
  }

  function handleLogout() {
    void authApi.logout();
    setUser(null);
    setCurrentView("free");
  }

  if (authLoading) {
    return <p className="status-message">Loading...</p>;
  }

  return (
    <div className="app">
      <DemoToolbar
        user={user}
        onAuthenticated={handleDemoAuthenticated}
        onDemoDataChanged={handleDemoDataChanged}
      />
      <NavHeader
        currentView={currentView}
        user={user}
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
              <p className="error-message">You must be logged in to create a post.</p>
              <button
                type="button"
                className="btn"
                onClick={() => setCurrentView("auth")}
              >
                Go to Login
              </button>
            </section>
          ))}
        {currentView === "admin" && <AdminReview user={user} />}
        {currentView === "notifications" && <Notifications user={user} />}
        {currentView === "auth" && (
          <AuthView onAuthenticated={handleAuthenticated} />
        )}
      </main>
    </div>
  );
}

export default App;

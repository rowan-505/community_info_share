import { useState, type FormEvent } from "react";
import { authApi } from "../api/authApi";
import type { AuthUser } from "../types/auth";

interface AuthViewProps {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        // Registration issues no token; log in immediately afterwards.
        await authApi.register({ email, password, displayName });
      }

      const user = await authApi.login({ email, password });
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="view auth-view">
      <div className="card auth-card">
        <div className="auth-card-header">
          <h2>{mode === "login" ? "Login" : "Register"}</h2>
          <p className="view-note">
            {mode === "login"
              ? "Log in to create community posts."
              : "Create an account to post on the community board."}
          </p>
        </div>

        <div className="auth-toggle" aria-label="Authentication mode">
          <button
            type="button"
            className={`button ${mode === "login" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`button ${mode === "register" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        <form className="form auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="form-group">
              <span>Display name</span>
              <input
                className="input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          )}
          <label className="form-group">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label className="form-group">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? 6 : 1}
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            className="button button-primary auth-submit-button"
            disabled={loading}
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </section>
  );
}

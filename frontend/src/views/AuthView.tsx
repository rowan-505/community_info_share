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
    <section className="view">
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <p className="view-note">
        {mode === "login"
          ? "Log in to create community posts."
          : "Create an account to post on the community board."}
      </p>

      <div className="auth-toggle">
        <button
          type="button"
          className={`btn ${mode === "login" ? "btn-active" : ""}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`btn ${mode === "register" ? "btn-active" : ""}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form className="create-form" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 6 : 1}
            disabled={loading}
          />
        </label>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
    </section>
  );
}

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../auth/tokenStorage";

export const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface ApiResponse<T> {
  data: T;
}

interface ApiErrorBody {
  message?: string;
  error?: string;
}

interface RequestOptions extends RequestInit {
  auth?: "optional" | "required";
  /** Internal: marks a request that has already been retried after a refresh. */
  retried?: boolean;
}

/**
 * Attempt a single refresh using the stored refresh token. On success the new
 * tokens are stored and `true` is returned; on failure the session is cleared.
 */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = "optional", retried = false, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  // Only declare a JSON content-type when a body is actually sent. Bodyless
  // requests (e.g. the admin verify/reject actions, notifications mark-as-read)
  // must not set Content-Type: application/json, or Fastify rejects them with
  // "Body cannot be empty when content-type is set to 'application/json'".
  if (fetchOptions.body != null && headers["Content-Type"] === undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (auth === "required" && !token) {
    throw new Error("You must be logged in");
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers,
  });

  // On 401, transparently attempt one refresh + retry of the original request.
  if (response.status === 401 && !retried && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, retried: true });
    }
    clearTokens();
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.message ?? body.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

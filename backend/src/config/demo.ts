export type DemoUserKey = "user" | "reactor" | "admin";

export interface DemoUserConfig {
  key: DemoUserKey;
  email: string;
  displayName: string;
  roleCode: string;
}

/**
 * The three fixed demo users. They live in the shared app_auth.auth_users table
 * (never a separate demo-only table) but are unambiguously identified by their
 * exact @coremap.local emails. They are created idempotently and are NEVER
 * deleted by demo reset.
 */
export const DEMO_USERS: readonly DemoUserConfig[] = [
  {
    key: "user",
    email: "demo.user@coremap.local",
    displayName: "[DEMO] User",
    roleCode: "user",
  },
  {
    key: "reactor",
    email: "demo.reactor@coremap.local",
    displayName: "[DEMO] Reactor",
    roleCode: "user",
  },
  {
    key: "admin",
    email: "demo.admin@coremap.local",
    displayName: "[DEMO] Admin",
    roleCode: "admin",
  },
] as const;

/** Fast lookup set of the exact demo emails. Used to identify demo-owned rows. */
export const DEMO_EMAILS: ReadonlySet<string> = new Set(
  DEMO_USERS.map((user) => user.email),
);

/**
 * Fixed password stored for demo accounts. Demo login never checks it (it mints
 * a real JWT directly), but a valid hash must exist to satisfy the schema.
 */
export const DEMO_PASSWORD = "demo-mode-not-for-production";

export function getDemoUserByKey(key: DemoUserKey): DemoUserConfig {
  const config = DEMO_USERS.find((user) => user.key === key);
  if (!config) {
    throw new Error(`Unknown demo user key: ${key}`);
  }
  return config;
}

/**
 * Demo Mode is active only when DEMO_MODE=true AND NODE_ENV is not production.
 * Checked at request time so production can never expose demo routes and Demo
 * Mode never bypasses real authentication.
 */
export function isDemoModeEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return process.env.DEMO_MODE === "true" && nodeEnv !== "production";
}

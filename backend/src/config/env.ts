import { isDemoModeEnabled } from "./demo.js";

export interface EnvConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  corsOrigin?: string[] | undefined;
  demoMode: boolean;
}

function parseCorsOrigin(): string[] | undefined {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return undefined;
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function loadEnv(): EnvConfig {
  const port = Number(process.env.PORT) || 3000;
  const nodeEnv = process.env.NODE_ENV || "development";
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return {
    port,
    nodeEnv,
    jwtSecret,
    corsOrigin: parseCorsOrigin(),
    demoMode: isDemoModeEnabled(),
  };
}

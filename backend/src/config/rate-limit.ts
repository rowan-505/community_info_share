export interface RateLimitRule {
  max: number;
  timeWindow: number;
}

export interface RateLimitConfig {
  login: RateLimitRule;
  register: RateLimitRule;
  createPost: RateLimitRule;
  reactions: RateLimitRule;
}

function parseLimit(name: string, defaultMax: number, defaultWindowMs: number): RateLimitRule {
  const max = Number(process.env[`RATE_LIMIT_${name}_MAX`]) || defaultMax;
  const timeWindow =
    Number(process.env[`RATE_LIMIT_${name}_WINDOW_MS`]) || defaultWindowMs;

  return { max, timeWindow };
}

export function loadRateLimitConfig(): RateLimitConfig {
  return {
    login: parseLimit("LOGIN", 10, 60_000),
    register: parseLimit("REGISTER", 5, 60_000),
    createPost: parseLimit("CREATE_POST", 20, 60_000),
    reactions: parseLimit("REACTIONS", 30, 60_000),
  };
}

export function toRouteRateLimit(rule: RateLimitRule) {
  return {
    max: rule.max,
    timeWindow: rule.timeWindow,
  };
}

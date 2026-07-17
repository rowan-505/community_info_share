import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";
import { loadRateLimitConfig } from "../config/rate-limit.js";

export const registerRateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: false,
    ban: 0,
  });

  app.decorate("rateLimits", loadRateLimitConfig());
});

declare module "fastify" {
  interface FastifyInstance {
    rateLimits: import("../config/rate-limit.js").RateLimitConfig;
  }
}

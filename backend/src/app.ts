import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { adminReviewRoutes } from "./modules/admin-review/admin-review.routes.js";
import { adminUsersRoutes } from "./modules/admin-users/admin-users.routes.js";
import { communityPostsRoutes } from "./modules/community-posts/community-posts.routes.js";
import { demoRoutes } from "./modules/demo/demo.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { notificationsRoutes } from "./modules/notifications/notifications.routes.js";
import { registerAuthPlugin } from "./plugins/auth.js";
import { registerPrismaPlugin } from "./plugins/prisma.js";
import { registerRateLimitPlugin } from "./plugins/rate-limit.js";
import { registerSwaggerPlugin } from "./plugins/swagger.js";
import { registerErrorHandler } from "./shared/errors/error-handler.js";

export async function buildApp() {
  const env = loadEnv();

  const app = Fastify({
    logger: env.nodeEnv === "development",
  });

  // Registration order: CORS -> rate limit -> Prisma -> auth -> routes.
  // @fastify/cors defaults `methods` to GET,HEAD,POST only, so PATCH (and any
  // future PUT/DELETE) must be listed explicitly or their preflight is rejected.
  await app.register(cors, {
    origin: env.corsOrigin ?? true,
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  await app.register(registerRateLimitPlugin);
  await app.register(registerPrismaPlugin);
  await app.register(registerAuthPlugin);
  await app.register(registerSwaggerPlugin);
  registerErrorHandler(app);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(communityPostsRoutes);
  await app.register(adminReviewRoutes);
  await app.register(adminUsersRoutes);
  await app.register(notificationsRoutes);

  // Demo Mode: registered ONLY when DEMO_MODE=true (env.demoMode). Showcase
  // deployments may enable this intentionally; real production must keep
  // DEMO_MODE=false. Demo Mode never bypasses JWT or role checks.
  if (env.demoMode) {
    await app.register(demoRoutes);
    app.log.warn(
      "Demo Mode is ENABLED (/demo/*). Showcase/classroom only — disable DEMO_MODE for real production.",
    );
  }

  return app;
}

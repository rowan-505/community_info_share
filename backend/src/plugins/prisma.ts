import fp from "fastify-plugin";
import { prisma } from "../db/prisma.js";

/**
 * Shares the singleton PrismaClient with the Fastify instance as `app.prisma`
 * and disconnects it on shutdown.
 */
export const registerPrismaPlugin = fp(async (app) => {
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

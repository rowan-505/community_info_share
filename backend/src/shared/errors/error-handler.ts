import type { FastifyError, FastifyInstance } from "fastify";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500;

    reply.status(statusCode).send({
      error: statusCode >= 500 ? "Internal Server Error" : error.message,
      message: error.message,
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: "Not Found",
      message: "Route not found",
    });
  });
}

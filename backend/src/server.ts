import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { flagsRoutes } from "./routes/flags.js";

const app = Fastify({ logger: true });
const MAX_PORT_ATTEMPTS = 10;

app.register(cors, { origin: true });
app.register(flagsRoutes, { prefix: "/api" });

app.get("/health", async () => ({ status: "ok", service: "feature-flags-api" }));

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: "Validation error",
      details: error.issues,
    });
  }

  app.log.error(error);
  return reply.code(500).send({ error: "Internal server error" });
});

const closeConnections = async (): Promise<void> => {
  await prisma.$disconnect();
  await redis.quit();
};

async function start() {
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
    const currentPort = config.PORT + attempt;

    try {
      await app.listen({ port: currentPort, host: "0.0.0.0" });
      return;
    } catch (error) {
      const isAddressInUse =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "EADDRINUSE";

      if (isAddressInUse && attempt < MAX_PORT_ATTEMPTS - 1) {
        app.log.warn(`Port ${currentPort} already in use. Trying ${currentPort + 1}.`);
        continue;
      }

      app.log.error(error);
      await closeConnections();
      process.exit(1);
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await closeConnections();
    await app.close();
  });
}

start();

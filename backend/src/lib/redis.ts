import { Redis } from "ioredis";
import { config } from "../config.js";

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
});

redis.on("error", (error) => {
  // Avoid unhandled error events when Redis is briefly unavailable.
  const message = error instanceof Error ? error.message || error.name : String(error);
  console.error("[redis] connection error:", message);
});

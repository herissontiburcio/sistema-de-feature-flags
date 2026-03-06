import { Environment, FeatureFlag } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { isUserInRollout } from "./rollout.js";

const CACHE_TTL_SECONDS = 30;

function cacheKey(environment: Environment): string {
  return `flags:${environment}`;
}

async function getFlagsByEnvironment(environment: Environment): Promise<FeatureFlag[]> {
  const key = cacheKey(environment);
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached) as FeatureFlag[];
  }

  const flags = await prisma.featureFlag.findMany({
    where: { environment },
    orderBy: { createdAt: "desc" },
  });

  await redis.set(key, JSON.stringify(flags), "EX", CACHE_TTL_SECONDS);
  return flags;
}

export async function invalidateEnvironmentCache(environment: Environment): Promise<void> {
  await redis.del(cacheKey(environment));
}

export async function evaluateFlag(params: {
  key: string;
  userId: string;
  environment: Environment;
}): Promise<{ enabled: boolean; reason: string }> {
  const { key, userId, environment } = params;
  const flags = await getFlagsByEnvironment(environment);
  const flag = flags.find((candidate) => candidate.key === key);

  if (!flag) {
    return { enabled: false, reason: "flag_not_found" };
  }

  if (!flag.enabled) {
    return { enabled: false, reason: "flag_disabled" };
  }

  const insideRollout = isUserInRollout(userId, key, flag.rollout);

  if (!insideRollout) {
    return { enabled: false, reason: "outside_rollout" };
  }

  return { enabled: true, reason: "enabled_for_user" };
}

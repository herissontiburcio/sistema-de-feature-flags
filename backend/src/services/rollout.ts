import crypto from "node:crypto";

export function isUserInRollout(userId: string, flagKey: string, rollout: number): boolean {
  if (rollout <= 0) {
    return false;
  }

  if (rollout >= 100) {
    return true;
  }

  const hash = crypto
    .createHash("sha256")
    .update(`${flagKey}:${userId}`)
    .digest("hex");

  const bucket = Number.parseInt(hash.slice(0, 8), 16) % 100;
  return bucket < rollout;
}

import { Environment, Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { evaluateFlag, invalidateEnvironmentCache } from "../services/flag-evaluator.js";

const environmentSchema = z.enum(["DEV", "STAGING", "PROD"]);

const createFlagSchema = z.object({
  key: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(4),
  enabled: z.boolean().default(false),
  rollout: z.number().int().min(0).max(100).default(0),
  environment: environmentSchema,
  actor: z.string().min(2),
});

const updateFlagSchema = z
  .object({
    description: z.string().min(4).optional(),
    enabled: z.boolean().optional(),
    rollout: z.number().int().min(0).max(100).optional(),
    environment: environmentSchema.optional(),
    actor: z.string().min(2),
  })
  .refine(
    (value) =>
      value.description !== undefined ||
      value.enabled !== undefined ||
      value.rollout !== undefined ||
      value.environment !== undefined,
    {
      message: "No fields to update",
    },
  );

const evaluateSchema = z.object({
  key: z.string(),
  userId: z.string().min(1),
  environment: environmentSchema,
});

const listFlagsSchema = z.object({
  environment: environmentSchema.optional(),
});

export async function flagsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/flags", async (request) => {
    const query = listFlagsSchema.parse(request.query);

    const flags = await prisma.featureFlag.findMany({
      where: query.environment ? { environment: query.environment } : undefined,
      orderBy: [{ environment: "asc" }, { createdAt: "desc" }],
    });

    return { data: flags };
  });

  app.post("/flags", async (request, reply) => {
    const payload = createFlagSchema.parse(request.body);

    const created = await prisma.$transaction(async (tx) => {
      const featureFlag = await tx.featureFlag.create({
        data: {
          key: payload.key,
          description: payload.description,
          enabled: payload.enabled,
          rollout: payload.rollout,
          environment: payload.environment,
          createdBy: payload.actor,
          updatedBy: payload.actor,
        },
      });

      await tx.auditLog.create({
        data: {
          flagId: featureFlag.id,
          action: "FLAG_CREATED",
          actor: payload.actor,
          previousState: Prisma.JsonNull,
          newState: featureFlag,
          environment: featureFlag.environment,
        },
      });

      return featureFlag;
    });

    await invalidateEnvironmentCache(created.environment);
    return reply.code(201).send({ data: created });
  });

  app.patch("/flags/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = updateFlagSchema.parse(request.body);

    const existing = await prisma.featureFlag.findUnique({ where: { id } });

    if (!existing) {
      return reply.code(404).send({ error: "Flag not found" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextEnvironment = payload.environment ?? existing.environment;

      const featureFlag = await tx.featureFlag.update({
        where: { id },
        data: {
          description: payload.description,
          enabled: payload.enabled,
          rollout: payload.rollout,
          environment: payload.environment,
          updatedBy: payload.actor,
        },
      });

      await tx.auditLog.create({
        data: {
          flagId: featureFlag.id,
          action: "FLAG_UPDATED",
          actor: payload.actor,
          previousState: existing,
          newState: featureFlag,
          environment: nextEnvironment,
        },
      });

      return featureFlag;
    });

    await invalidateEnvironmentCache(existing.environment);
    if (existing.environment !== updated.environment) {
      await invalidateEnvironmentCache(updated.environment);
    }

    return { data: updated };
  });

  app.get("/flags/:id/audit", async (request) => {
    const { id } = request.params as { id: string };

    const logs = await prisma.auditLog.findMany({
      where: { flagId: id },
      orderBy: { createdAt: "desc" },
    });

    return { data: logs };
  });

  app.post("/flags/evaluate", async (request) => {
    const payload = evaluateSchema.parse(request.body);

    const evaluation = await evaluateFlag({
      key: payload.key,
      userId: payload.userId,
      environment: payload.environment as Environment,
    });

    return {
      data: {
        key: payload.key,
        userId: payload.userId,
        environment: payload.environment,
        ...evaluation,
      },
    };
  });
}

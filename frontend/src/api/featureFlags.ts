import { api } from "./client";
import type { AuditLog, Environment, EvaluationResponse, FeatureFlag } from "../types";

export async function listFlags(environment?: Environment): Promise<FeatureFlag[]> {
  const response = await api.get<{ data: FeatureFlag[] }>("/flags", {
    params: environment ? { environment } : undefined,
  });

  return response.data.data;
}

export async function createFlag(payload: {
  key: string;
  description: string;
  enabled: boolean;
  rollout: number;
  environment: Environment;
  actor: string;
}): Promise<FeatureFlag> {
  const response = await api.post<{ data: FeatureFlag }>("/flags", payload);
  return response.data.data;
}

export async function updateFlag(
  id: string,
  payload: {
    description?: string;
    enabled?: boolean;
    rollout?: number;
    environment?: Environment;
    actor: string;
  },
): Promise<FeatureFlag> {
  const response = await api.patch<{ data: FeatureFlag }>(`/flags/${id}`, payload);
  return response.data.data;
}

export async function getFlagHistory(flagId: string): Promise<AuditLog[]> {
  const response = await api.get<{ data: AuditLog[] }>(`/flags/${flagId}/audit`);
  return response.data.data;
}

export async function evaluateFeature(payload: {
  key: string;
  userId: string;
  environment: Environment;
}): Promise<EvaluationResponse> {
  const response = await api.post<{ data: EvaluationResponse }>("/flags/evaluate", payload);
  return response.data.data;
}

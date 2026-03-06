export type Environment = "DEV" | "STAGING" | "PROD";

export type FeatureFlag = {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rollout: number;
  environment: Environment;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  flagId: string;
  action: string;
  actor: string;
  previousState: unknown;
  newState: unknown;
  createdAt: string;
  environment: Environment;
};

export type EvaluationResponse = {
  key: string;
  userId: string;
  environment: Environment;
  enabled: boolean;
  reason: string;
};

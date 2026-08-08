import type { AtsProviderId } from "../../types/common";
import type { TokenPair } from "../../types/common";
import type { ConnectTokenStatus } from "../auth/types";

export type ConnectConnectionStatus =
  | "pending"
  | "connected"
  | "disconnected"
  | "expired"
  | "error"
  | "reconnect_required";

export interface CreateConnectionInput {
  employerAccountId: string;
  provider: AtsProviderId;
  status?: ConnectConnectionStatus;
  oauthScopes?: string[];
  metadata?: Record<string, unknown>;
}

export interface CompleteConnectionInput {
  connectionId: string;
  tokens: TokenPair;
  providerAccountId?: string;
  providerAccountName?: string;
}

export interface ConnectionHealthUpdate {
  lastHealthCheckAt: string;
  lastHealthStatus: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  providerAccountId?: string;
  providerAccountName?: string;
  checkedAt: string;
}

export interface ScopeValidationResult {
  valid: boolean;
  granted: string[];
  required: string[];
  missing: string[];
}

export interface ConnectionSummary {
  connectionId: string;
  employerAccountId: string;
  provider: AtsProviderId;
  status: ConnectConnectionStatus;
  tokenStatus: ConnectTokenStatus;
  oauthScopes: string[];
  providerAccountId?: string;
  providerAccountName?: string;
  tokenExpiresAt?: string;
  lastHealthCheckAt?: string;
  lastHealthStatus?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

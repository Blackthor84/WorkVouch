import type {
  ConnectParams,
  ConnectResult,
  DisconnectParams,
  HealthCheckParams,
  HealthCheckResult,
  ProviderCapabilities,
  ProviderConfiguration,
  RefreshTokenParams,
  TestConnectionParams,
  TestConnectionResult,
  TokenPair,
  ValidationResult,
} from "../types/provider";
import type {
  SyncApplicationParams,
  SyncCandidateParams,
  SyncJobParams,
  SyncResult,
} from "../types/sync";
import type { ReceiveWebhookParams, WebhookReceiveResult } from "../types/webhook";
import type { AtsProviderId } from "../types/common";

/**
 * Provider-agnostic contract for every ATS integration.
 * Platform code must interact with providers only through this interface.
 */
export interface AtsProvider {
  readonly providerId: AtsProviderId;
  readonly displayName: string;

  connect(params: ConnectParams): Promise<ConnectResult>;
  disconnect(params: DisconnectParams): Promise<void>;
  healthCheck(params: HealthCheckParams): Promise<HealthCheckResult>;
  syncCandidate(params: SyncCandidateParams): Promise<SyncResult>;
  syncJob(params: SyncJobParams): Promise<SyncResult>;
  syncApplication(params: SyncApplicationParams): Promise<SyncResult>;
  receiveWebhook(params: ReceiveWebhookParams): Promise<WebhookReceiveResult>;
  refreshToken(params: RefreshTokenParams): Promise<TokenPair>;
  getCapabilities(): ProviderCapabilities;
  validateConfiguration(config: ProviderConfiguration): ValidationResult;
  testConnection(params: TestConnectionParams): Promise<TestConnectionResult>;
}

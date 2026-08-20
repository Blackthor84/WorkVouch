import type { AtsProviderId } from "../../../types/common";
import type { ConnectOAuthStateRecord } from "../../auth/types";

export interface OAuthStateRepository {
  save(record: ConnectOAuthStateRecord): Promise<void>;
  consume(state: string): Promise<ConnectOAuthStateRecord | null>;
  purgeExpired(): Promise<number>;
  findByConnectionId(connectionId: string): Promise<ConnectOAuthStateRecord | null>;
}

export interface SaveOAuthStateInput {
  state: string;
  connectionId: string;
  employerAccountId: string;
  provider: AtsProviderId;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: string;
  createdAt: string;
}

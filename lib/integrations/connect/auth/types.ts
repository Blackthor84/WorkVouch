import type { AtsProviderId } from "../../types/common";
import type { TokenPair } from "../../types/common";

export type ConnectTokenStatus = "valid" | "expired" | "revoked" | "unknown" | "pending";

export interface ConnectStoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes: string[];
  tokenStatus: ConnectTokenStatus;
}

export interface ConnectOAuthStateRecord {
  state: string;
  connectionId: string;
  employerAccountId: string;
  provider: AtsProviderId;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: string;
  createdAt: string;
}

export interface SaveConnectionTokensInput {
  connectionId: string;
  tokens: TokenPair;
  providerAccountId?: string;
  providerAccountName?: string;
}

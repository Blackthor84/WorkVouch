/** Shared primitives for the ATS integration platform. */

export type AtsProviderId =
  | "mock"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "bamboohr"
  | "rippling"
  | "hibob"
  | "icims"
  | "smartrecruiters";

export type IntegrationResultStatus = "success" | "failure" | "skipped" | "partial";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount?: number;
  hasMore: boolean;
  nextPage?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
}

export interface IntegrationErrorDetails {
  code: string;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
  provider?: AtsProviderId;
}

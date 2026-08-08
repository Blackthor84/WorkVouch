import { randomUUID } from "crypto";
import type {
  CanonicalApplication,
  CanonicalCandidate,
  CanonicalJob,
} from "../../types/sync";

export const MOCK_CONNECTIONS = new Map<
  string,
  { accessToken: string; refreshToken: string; employerAccountId: string }
>();

export const MOCK_CANDIDATES: CanonicalCandidate[] = [
  {
    externalCandidateId: "mock-candidate-1",
    email: "jane.chen@example.com",
    fullName: "Jane Chen",
    firstName: "Jane",
    lastName: "Chen",
    applicationStatus: "interview",
    jobExternalId: "mock-job-1",
    appliedAt: "2026-01-15T10:00:00Z",
  },
  {
    externalCandidateId: "mock-candidate-2",
    email: "marcus.williams@example.com",
    fullName: "Marcus Williams",
    firstName: "Marcus",
    lastName: "Williams",
    applicationStatus: "screening",
    jobExternalId: "mock-job-2",
    appliedAt: "2026-02-01T14:30:00Z",
  },
];

export const MOCK_JOBS: CanonicalJob[] = [
  {
    externalJobId: "mock-job-1",
    title: "Senior Software Engineer",
    status: "open",
    department: "Engineering",
    location: { country: "US", state: "CA" },
    openedAt: "2026-01-01T00:00:00Z",
  },
  {
    externalJobId: "mock-job-2",
    title: "Product Manager",
    status: "open",
    department: "Product",
    location: { country: "US", state: "NY" },
    openedAt: "2026-01-10T00:00:00Z",
  },
];

export const MOCK_APPLICATIONS: CanonicalApplication[] = [
  {
    externalApplicationId: "mock-app-1",
    externalCandidateId: "mock-candidate-1",
    externalJobId: "mock-job-1",
    status: "interview",
    appliedAt: "2026-01-15T10:00:00Z",
  },
  {
    externalApplicationId: "mock-app-2",
    externalCandidateId: "mock-candidate-2",
    externalJobId: "mock-job-2",
    status: "screening",
    appliedAt: "2026-02-01T14:30:00Z",
  },
];

export const MOCK_WEBHOOK_SECRET = "mock-webhook-secret";

export function createMockTokens(employerAccountId: string) {
  const connectionId = randomUUID();
  const accessToken = `mock_access_${connectionId}`;
  const refreshToken = `mock_refresh_${connectionId}`;
  MOCK_CONNECTIONS.set(connectionId, {
    accessToken,
    refreshToken,
    employerAccountId,
  });
  return { connectionId, accessToken, refreshToken };
}

export function resetMockStore(): void {
  MOCK_CONNECTIONS.clear();
}

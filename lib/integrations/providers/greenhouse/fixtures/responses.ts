import type { GreenhouseTokenResponse } from "../types";

export const FIXTURE_TOKEN_RESPONSE: GreenhouseTokenResponse = {
  access_token: "gh_access_token_fixture",
  refresh_token: "gh_refresh_token_fixture",
  expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  token_type: "Bearer",
  scope:
    "harvest:candidates:list harvest:candidates:update harvest:candidate_employments:list harvest:applications:list harvest:jobs:list harvest:job_interview_stages:list harvest:custom_fields:list",
};

export const FIXTURE_REFRESH_RESPONSE: GreenhouseTokenResponse = {
  access_token: "gh_access_token_refreshed",
  refresh_token: "gh_refresh_token_rotated",
  expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  token_type: "Bearer",
  scope: FIXTURE_TOKEN_RESPONSE.scope,
};

export const FIXTURE_V3_JOBS_PAGE = [
  {
    id: 1,
    name: "Security Supervisor",
    status: "open",
    updated_at: "2024-01-01T12:00:00.000Z",
  },
];

export const FIXTURE_V3_CANDIDATES_PAGE = [
  {
    id: 42,
    first_name: "Michael",
    last_name: "Carter",
    email_addresses: [{ value: "michael@example.com", type: "personal" }],
    updated_at: "2024-01-01T12:00:00.000Z",
  },
];

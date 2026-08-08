import type { GreenhouseTokenResponse, HarvestUser } from "../types";

export const FIXTURE_HARVEST_USER: HarvestUser = {
  id: 12345,
  name: "Jane Recruiter",
  email: "jane.recruiter@example.com",
};

export const FIXTURE_TOKEN_RESPONSE: GreenhouseTokenResponse = {
  access_token: "gh_access_token_fixture",
  refresh_token: "gh_refresh_token_fixture",
  expires_in: 3600,
  token_type: "Bearer",
  scope: "harvest:read harvest:write harvest:webhooks",
};

export const FIXTURE_REFRESH_RESPONSE: GreenhouseTokenResponse = {
  access_token: "gh_access_token_refreshed",
  refresh_token: "gh_refresh_token_fixture",
  expires_in: 3600,
  token_type: "Bearer",
  scope: "harvest:read harvest:write harvest:webhooks",
};

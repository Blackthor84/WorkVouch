/** Approved Greenhouse Harvest V3 Partner OAuth scopes for WorkVouch testing client. */
export const GREENHOUSE_PARTNER_SCOPES = [
  "harvest:candidates:list",
  "harvest:candidates:update",
  "harvest:candidate_employments:list",
  "harvest:applications:list",
  "harvest:jobs:list",
  "harvest:job_interview_stages:list",
  "harvest:custom_fields:list",
] as const;

export type GreenhousePartnerScope = (typeof GREENHOUSE_PARTNER_SCOPES)[number];

import type { AtsJob } from "../../../core/models/Job";
import type { GreenhouseJob } from "../models";
import {
  GREENHOUSE_PROVIDER,
  providerMetadata,
  toExternalId,
} from "./sharedMapper";
import { mapGreenhouseCustomFields } from "./customFieldMapper";

export const JOB_MAPPER_NAME = "greenhouse.jobMapper";

function mapJobStatus(status?: string): AtsJob["status"] {
  switch ((status ?? "open").toLowerCase()) {
    case "closed":
      return "closed";
    case "draft":
      return "draft";
    case "archived":
      return "archived";
    default:
      return "open";
  }
}

export function mapGreenhouseJob(raw: GreenhouseJob): AtsJob {
  return {
    externalId: toExternalId(raw.id),
    provider: GREENHOUSE_PROVIDER,
    title: raw.name,
    status: mapJobStatus(raw.status),
    department: raw.departments?.[0]?.name,
    openedAt: raw.opened_at,
    closedAt: raw.closed_at,
    metadata: {
      ...providerMetadata(JOB_MAPPER_NAME),
      customFields: mapGreenhouseCustomFields(raw.custom_fields),
    },
  };
}

export function parseGreenhouseJob(payload: Record<string, unknown>): GreenhouseJob {
  return payload as unknown as GreenhouseJob;
}

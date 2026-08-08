import type { AtsCandidate } from "../../../core/models/Candidate";
import type { GreenhouseCandidate } from "../models";
import {
  buildFullName,
  GREENHOUSE_PROVIDER,
  pickPrimaryEmail,
  pickPrimaryPhone,
  providerMetadata,
  toExternalId,
} from "./sharedMapper";
import { mapGreenhouseStageToStatus } from "./statusMapper";
import { mapGreenhouseCustomFields } from "./customFieldMapper";

export const CANDIDATE_MAPPER_NAME = "greenhouse.candidateMapper";

export function mapGreenhouseCandidate(raw: GreenhouseCandidate): AtsCandidate {
  const firstApplication = raw.applications?.[0];
  const stageName = firstApplication?.current_stage?.name;

  return {
    externalId: toExternalId(raw.id),
    provider: GREENHOUSE_PROVIDER,
    email: pickPrimaryEmail(raw.email_addresses),
    fullName: buildFullName(raw.first_name, raw.last_name),
    firstName: raw.first_name,
    lastName: raw.last_name,
    phone: pickPrimaryPhone(raw.phone_numbers),
    applicationStatus: stageName ? mapGreenhouseStageToStatus(stageName) : undefined,
    jobExternalId: firstApplication?.jobs?.[0]?.id
      ? toExternalId(firstApplication.jobs[0].id)
      : undefined,
    applicationExternalId: firstApplication?.id
      ? toExternalId(firstApplication.id)
      : undefined,
    trustStatus: "not_linked",
    verificationStatus: "not_invited",
    appliedAt: firstApplication?.applied_at,
    updatedAt: raw.updated_at,
    metadata: {
      ...providerMetadata(CANDIDATE_MAPPER_NAME),
      customFields: mapGreenhouseCustomFields(raw.custom_fields),
    },
  };
}

export function parseGreenhouseCandidate(payload: Record<string, unknown>): GreenhouseCandidate {
  return payload as unknown as GreenhouseCandidate;
}

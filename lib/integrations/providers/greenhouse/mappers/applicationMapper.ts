import type { AtsApplication } from "../../../core/models/Application";
import type { GreenhouseApplication, GreenhouseOffer } from "../models";
import {
  GREENHOUSE_PROVIDER,
  providerMetadata,
  toExternalId,
} from "./sharedMapper";
import {
  mapGreenhouseActionToApplicationStatus,
  mapGreenhouseApplicationStatus,
  mapGreenhouseStageToStatus,
} from "./statusMapper";
import { mapGreenhouseCustomFields } from "./customFieldMapper";

export const APPLICATION_MAPPER_NAME = "greenhouse.applicationMapper";

export function mapGreenhouseApplication(raw: GreenhouseApplication): AtsApplication {
  const stageName = raw.current_stage?.name;
  const status = stageName
    ? mapGreenhouseStageToStatus(stageName)
    : mapGreenhouseApplicationStatus(raw.status);

  return {
    externalId: toExternalId(raw.id),
    provider: GREENHOUSE_PROVIDER,
    candidateExternalId: toExternalId(raw.candidate_id),
    jobExternalId: toExternalId(raw.jobs?.[0]?.id),
    status,
    stageName,
    appliedAt: raw.applied_at,
    updatedAt: raw.updated_at,
    metadata: {
      ...providerMetadata(APPLICATION_MAPPER_NAME),
      customFields: mapGreenhouseCustomFields(raw.custom_fields),
    },
  };
}

export function mapGreenhouseApplicationFromAction(
  raw: Record<string, unknown>,
  action: string
): AtsApplication {
  const application = raw as unknown as GreenhouseApplication;
  const stageName = application.current_stage?.name;
  const status = stageName
    ? mapGreenhouseStageToStatus(stageName)
    : mapGreenhouseActionToApplicationStatus(action);

  return {
    externalId: toExternalId(application.id),
    provider: GREENHOUSE_PROVIDER,
    candidateExternalId: toExternalId(application.candidate_id),
    jobExternalId: toExternalId(application.jobs?.[0]?.id),
    status,
    stageName,
    appliedAt: application.applied_at,
    updatedAt: application.updated_at,
    metadata: providerMetadata(APPLICATION_MAPPER_NAME),
  };
}

export function mapGreenhouseOfferApplication(
  offer: GreenhouseOffer,
  action: string
): AtsApplication {
  return {
    externalId: toExternalId(offer.application_id),
    provider: GREENHOUSE_PROVIDER,
    candidateExternalId: toExternalId(offer.candidate_id),
    jobExternalId: "",
    status: mapGreenhouseActionToApplicationStatus(action),
    offerExternalId: toExternalId(offer.id),
    updatedAt: offer.updated_at ?? offer.created_at,
    metadata: providerMetadata(APPLICATION_MAPPER_NAME),
  };
}

export function parseGreenhouseApplication(payload: Record<string, unknown>): GreenhouseApplication {
  return payload as unknown as GreenhouseApplication;
}

export function parseGreenhouseOffer(payload: Record<string, unknown>): GreenhouseOffer {
  return payload as unknown as GreenhouseOffer;
}

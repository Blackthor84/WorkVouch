import type { AtsCompany } from "../../../core/models/Company";
import type { GreenhouseCompany } from "../models";
import { GREENHOUSE_PROVIDER, providerMetadata, toExternalId } from "./sharedMapper";

export const COMPANY_MAPPER_NAME = "greenhouse.companyMapper";

export function mapGreenhouseCompany(raw: GreenhouseCompany): AtsCompany {
  return {
    externalId: toExternalId(raw.id),
    provider: GREENHOUSE_PROVIDER,
    name: raw.name,
    metadata: providerMetadata(COMPANY_MAPPER_NAME),
  };
}

export function parseGreenhouseCompany(payload: Record<string, unknown>): GreenhouseCompany {
  return payload as unknown as GreenhouseCompany;
}

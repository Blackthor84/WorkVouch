import type { ConnectAggregateType } from "../persistence/types";

export function resolveAggregateFromTranslation(input: {
  universalEvent?: string;
  universalModel?: unknown;
  connectionId: string;
}): { aggregateType: ConnectAggregateType; aggregateId: string } {
  const model = input.universalModel as Record<string, unknown> | undefined;
  const entity = (model?.entity ?? model ?? {}) as Record<string, unknown>;
  const candidate = (entity.candidate ?? entity) as Record<string, unknown>;
  const job = (entity.job ?? entity) as Record<string, unknown>;
  const application = (entity.application ?? entity) as Record<string, unknown>;
  if (input.universalEvent?.includes("job")) {
    return {
      aggregateType: "job",
      aggregateId: String(job.externalId ?? application.jobExternalId ?? input.connectionId),
    };
  }

  if (input.universalEvent?.includes("application") || input.universalEvent?.includes("offer")) {
    return {
      aggregateType: "application",
      aggregateId: String(application.externalId ?? candidate.applicationExternalId ?? input.connectionId),
    };
  }

  if (input.universalEvent?.includes("candidate")) {
    return {
      aggregateType: "candidate",
      aggregateId: String(candidate.externalId ?? application.candidateExternalId ?? input.connectionId),
    };
  }

  return { aggregateType: "webhook", aggregateId: input.connectionId };
}

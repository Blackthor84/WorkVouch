import type { ApplicationStatus } from "../../../types/sync";

const STAGE_STATUS_MAP: Record<string, ApplicationStatus> = {
  "application review": "applied",
  "phone screen": "screening",
  "take home test": "screening",
  "on-site interview": "interview",
  "final interview": "interview",
  "reference check": "interview",
  offer: "offer",
  "offer accepted": "offer",
  hired: "hired",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

const GH_STATUS_MAP: Record<string, ApplicationStatus> = {
  active: "applied",
  hired: "hired",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

export function mapGreenhouseStageToStatus(stageName?: string): ApplicationStatus {
  if (!stageName) return "unknown";
  const normalized = stageName.trim().toLowerCase();
  return STAGE_STATUS_MAP[normalized] ?? "unknown";
}

export function mapGreenhouseApplicationStatus(status?: string): ApplicationStatus {
  if (!status) return "unknown";
  const normalized = status.trim().toLowerCase();
  return GH_STATUS_MAP[normalized] ?? "unknown";
}

export function mapGreenhouseActionToApplicationStatus(action: string): ApplicationStatus {
  switch (action) {
    case "hire_candidate":
      return "hired";
    case "reject_candidate":
      return "rejected";
    case "candidate_withdrawn":
      return "withdrawn";
    case "offer_created":
    case "offer_accepted":
      return "offer";
    default:
      return "unknown";
  }
}

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return status === "hired" || status === "rejected" || status === "withdrawn";
}

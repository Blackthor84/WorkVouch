import type { PlatformStatus } from "./directory-types";

export function platformStatusLabel(status: PlatformStatus): string {
  switch (status) {
    case "imported_not_on_workvouch":
      return "Imported · Not on WorkVouch";
    case "linked_in_progress":
      return "On WorkVouch · In progress";
    case "verified_on_workvouch":
      return "Verified on WorkVouch";
    case "ambiguous_link":
      return "Needs manual link";
    case "saved_from_search":
      return "Saved from search";
    default:
      return "Candidate";
  }
}

export function platformStatusBadgeVariant(
  status: PlatformStatus
): "default" | "success" | "warning" | "danger" | "brand" {
  switch (status) {
    case "verified_on_workvouch":
      return "success";
    case "imported_not_on_workvouch":
      return "brand";
    case "ambiguous_link":
      return "warning";
    case "linked_in_progress":
      return "default";
    case "saved_from_search":
      return "default";
    default:
      return "default";
  }
}

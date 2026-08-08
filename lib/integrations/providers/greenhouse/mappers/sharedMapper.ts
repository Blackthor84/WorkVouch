import type { AtsProviderId } from "../../../types/common";

export const GREENHOUSE_PROVIDER: AtsProviderId = "greenhouse";

export function toExternalId(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return String(value);
}

export function pickPrimaryEmail(
  emails?: Array<{ value: string; type?: string }>
): string {
  if (!emails?.length) return "";
  const work = emails.find((item) => item.type?.toLowerCase() === "work");
  return (work ?? emails[0]).value.trim();
}

export function pickPrimaryPhone(
  phones?: Array<{ value: string; type?: string }>
): string | undefined {
  if (!phones?.length) return undefined;
  const mobile = phones.find((item) => item.type?.toLowerCase() === "mobile");
  return (mobile ?? phones[0]).value.trim();
}

export function buildFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function parseGreenhousePayload(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    return JSON.parse(raw) as Record<string, unknown>;
  }
  if (typeof raw === "object" && raw !== null) {
    return raw as Record<string, unknown>;
  }
  throw new Error("Malformed Greenhouse payload: expected object or JSON string.");
}

export function assertRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Malformed Greenhouse payload: ${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

export function readNumber(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  throw new Error(`Malformed Greenhouse payload: ${field} must be numeric.`);
}

export function readString(value: unknown, field: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  throw new Error(`Malformed Greenhouse payload: ${field} must be a string.`);
}

export function readOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function providerMetadata(source: string): Record<string, unknown> {
  return { source, provider: GREENHOUSE_PROVIDER };
}

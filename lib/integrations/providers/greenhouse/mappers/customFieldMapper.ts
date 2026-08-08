import type { GreenhouseCustomField } from "../models";

export function mapGreenhouseCustomFields(
  fields?: GreenhouseCustomField[]
): Record<string, unknown> {
  if (!fields?.length) return {};
  const mapped: Record<string, unknown> = {};
  for (const field of fields) {
    if (!field.name) continue;
    mapped[field.name] = field.value ?? null;
  }
  return mapped;
}

export function extractCustomField(
  fields: GreenhouseCustomField[] | undefined,
  name: string
): unknown {
  return fields?.find((field) => field.name === name)?.value;
}

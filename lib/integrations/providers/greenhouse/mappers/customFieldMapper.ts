import type { GreenhouseCustomField } from "../models";

function normalizeCustomFieldList(
  fields?: GreenhouseCustomField[] | Record<string, GreenhouseCustomField>
): GreenhouseCustomField[] {
  if (!fields) return [];
  if (Array.isArray(fields)) return fields;
  return Object.values(fields).filter(
    (field): field is GreenhouseCustomField =>
      Boolean(field && typeof field === "object" && field.name)
  );
}

export function mapGreenhouseCustomFields(
  fields?: GreenhouseCustomField[] | Record<string, GreenhouseCustomField>
): Record<string, unknown> {
  const normalized = normalizeCustomFieldList(fields);
  if (!normalized.length) return {};
  const mapped: Record<string, unknown> = {};
  for (const field of normalized) {
    if (!field.name) continue;
    mapped[field.name] = field.value ?? null;
  }
  return mapped;
}

export function extractCustomField(
  fields: GreenhouseCustomField[] | Record<string, GreenhouseCustomField> | undefined,
  name: string
): unknown {
  const normalized = normalizeCustomFieldList(fields);
  return normalized.find((field) => field.name === name)?.value;
}

/** Read-only catalog of Greenhouse custom field definitions (V3 /custom_fields). */
export function mapCustomFieldDefinitions(
  definitions: Array<{ id: number; name: string; field_type?: string; value_type?: string }>
): Record<string, { id: number; fieldType?: string; valueType?: string }> {
  const mapped: Record<string, { id: number; fieldType?: string; valueType?: string }> = {};
  for (const def of definitions) {
    mapped[def.name] = {
      id: def.id,
      fieldType: def.field_type,
      valueType: def.value_type,
    };
  }
  return mapped;
}

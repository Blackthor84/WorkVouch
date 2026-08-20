/**
 * Profile population rules — existing confirmed values protected by default.
 */

import type { IdentityConfirmInput, ProfileFieldChoice } from "./types";

export type ProfileSnapshot = {
  full_name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  location?: string | null;
};

export function normalizeProfileValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function profileFieldsConflict(
  existing: string | null | undefined,
  incoming: string | null | undefined
): boolean {
  const e = normalizeProfileValue(existing);
  const i = normalizeProfileValue(incoming);
  if (!e || !i) return false;
  return e.toLowerCase() !== i.toLowerCase();
}

function resolveField(
  fieldKey: keyof NonNullable<IdentityConfirmInput["field_choices"]>,
  existingValue: string | null | undefined,
  resumeValue: string | null | undefined,
  choice: ProfileFieldChoice | undefined
): { apply: boolean; value: string | null; conflictSkipped: boolean } {
  const existing = normalizeProfileValue(existingValue);
  const incoming = normalizeProfileValue(resumeValue);

  if (!incoming) {
    return { apply: false, value: null, conflictSkipped: false };
  }

  const hasConflict = profileFieldsConflict(existing, incoming);
  const effectiveChoice: ProfileFieldChoice =
    choice ?? (existing ? "keep_existing" : "use_resume");

  if (effectiveChoice === "keep_existing") {
    return { apply: false, value: null, conflictSkipped: hasConflict };
  }

  return { apply: true, value: incoming, conflictSkipped: false };
}

function buildLocationString(city?: string | null, state?: string | null, country?: string | null): string | null {
  const parts = [city, state, country].map((p) => normalizeProfileValue(p)).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export type ProfileUpdateResult = {
  updates: Record<string, string>;
  skipped_fields: string[];
};

/** Apply only fields the user explicitly chose or that fill empty profile slots. */
export function resolveProfileUpdates(
  existing: ProfileSnapshot,
  identity: IdentityConfirmInput
): ProfileUpdateResult {
  const updates: Record<string, string> = {};
  const skipped_fields: string[] = [];
  const choices = identity.field_choices ?? {};

  if (!identity.apply) {
    return { updates, skipped_fields };
  }

  const fullName = resolveField(
    "full_name",
    existing.full_name,
    identity.full_name,
    choices.full_name
  );
  if (fullName.apply && fullName.value) updates.full_name = fullName.value;
  if (fullName.conflictSkipped) skipped_fields.push("full_name");

  const city = resolveField("city", existing.city, identity.city, choices.city);
  if (city.apply && city.value) updates.city = city.value;
  if (city.conflictSkipped) skipped_fields.push("city");

  const state = resolveField("state", existing.state, identity.state, choices.state);
  if (state.apply && state.value) updates.state = state.value;
  if (state.conflictSkipped) skipped_fields.push("state");

  const resumeLocation = buildLocationString(identity.city, identity.state, identity.country);
  const location = resolveField(
    "location",
    existing.location,
    resumeLocation,
    choices.location
  );
  if (location.apply && location.value) updates.location = location.value;
  if (location.conflictSkipped) skipped_fields.push("location");

  return { updates, skipped_fields };
}

export function listProfileConflicts(
  existing: ProfileSnapshot,
  identity: IdentityConfirmInput
): Array<{ field: string; existing: string; resume: string }> {
  const conflicts: Array<{ field: string; existing: string; resume: string }> = [];
  const pairs: Array<[string, string | null | undefined, string | null | undefined]> = [
    ["full_name", existing.full_name, identity.full_name],
    ["city", existing.city, identity.city],
    ["state", existing.state, identity.state],
    ["location", existing.location, buildLocationString(identity.city, identity.state, identity.country)],
  ];

  for (const [field, ex, inc] of pairs) {
    if (profileFieldsConflict(ex, inc)) {
      conflicts.push({
        field,
        existing: normalizeProfileValue(ex),
        resume: normalizeProfileValue(inc),
      });
    }
  }

  return conflicts;
}

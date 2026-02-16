/**
 * Canonical user location for heat map (privacy-safe).
 * Allowed: country (ISO-2), state (US only). US requires state.
 * Never store: city, zip, lat/lng, IP. Used by capture and profile flows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export function validateUserLocation(country: string, state: string | null): { valid: boolean; error?: string } {
  const c = (country ?? "").trim();
  const s = state == null ? "" : String(state).trim();
  if (!c) return { valid: false, error: "Country required" };
  if (c === "US" && !s) return { valid: false, error: "US locations require state" };
  return { valid: true };
}

/**
 * Upsert user_locations from coarse geo (e.g. from headers). IP must be discarded before this.
 * Invalid records (e.g. US without state) are skipped; does not throw.
 */
export async function upsertUserLocationFromGeo(
  supabase: SupabaseClient,
  userId: string,
  country: string | null,
  region: string | null
): Promise<void> {
  const c = (country ?? "").trim() || null;
  const state = (region ?? "").trim() || null;
  if (!c) return;
  const { valid } = validateUserLocation(c, state);
  if (!valid) return; // e.g. US without state — drop record
  const now = new Date().toISOString();
  await supabase
    .from("user_locations")
    .upsert(
      {
        user_id: userId,
        country: c,
        state: state || null,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );
}

/**
 * Upsert from self-reported profile (country/state). Call from profile update API.
 * Throws if invalid (e.g. US without state) so caller can return 400.
 */
export async function upsertUserLocation(
  supabase: SupabaseClient,
  userId: string,
  country: string,
  state: string | null
): Promise<void> {
  const c = (country ?? "").trim();
  const s = state == null ? null : String(state).trim() || null;
  const { valid, error } = validateUserLocation(c, s ?? "");
  if (!valid) throw new Error(error ?? "Invalid location");
  const now = new Date().toISOString();
  const { error: err } = await supabase
    .from("user_locations")
    .upsert(
      { user_id: userId, country: c, state: s, updated_at: now },
      { onConflict: "user_id" }
    );
  if (err) throw err;
}

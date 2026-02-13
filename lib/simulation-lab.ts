/**
 * Simulation Lab: helpers for admin-only hybrid simulation.
 * Production queries must exclude is_simulation = true unless admin + active session.
 * Never trigger Stripe, emails, webhooks, directory, public passport, or billing.
 * Session scheduling: start_at, end (expires_at), auto_delete, status (scheduled|running|expired|deleted).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export const SIMULATION_SESSION_DEFAULT_MINUTES = 60;
export const SIMULATION_MAX_EXTEND_MINUTES = 120;

export type SimulationSessionStatus = "scheduled" | "running" | "expired" | "deleted";

export type { SimulationContext } from "@/lib/simulation/types";
export interface SimulationSessionRow {
  id: string;
  created_by_admin_id: string;
  created_at: string;
  start_at: string;
  expires_at: string;
  is_active: boolean;
  auto_delete: boolean;
  status: SimulationSessionStatus;
}

/**
 * Derive status from session row and current time (matches DB transition logic).
 */
export function deriveSessionStatus(row: {
  start_at: string;
  expires_at: string;
  status: string;
}): SimulationSessionStatus {
  const now = Date.now();
  const start = new Date(row.start_at).getTime();
  const end = new Date(row.expires_at).getTime();
  if (row.status === "deleted" || row.status === "expired") return row.status as SimulationSessionStatus;
  if (end <= now) return "expired";
  if (start > now) return "scheduled";
  return "running";
}

/**
 * Get effective status for a session (from DB; run transition first if needed).
 */
export async function getSessionStatus(sessionId: string): Promise<SimulationSessionStatus | null> {
  const supabase = getSupabaseServer() as SupabaseClient;
  const { data: row, error } = await supabase
    .from("simulation_sessions")
    .select("start_at, expires_at, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !row) return null;
  return deriveSessionStatus(row as { start_at: string; expires_at: string; status: string });
}

/**
 * Validate session is running before writes. Throws if session missing or not running.
 * When createdByAdminId is provided, only that admin's session is accepted.
 */
export async function validateSessionForWrite(
  sessionId: string,
  createdByAdminId?: string
): Promise<{
  id: string;
  expires_at: string;
  status: SimulationSessionStatus;
}> {
  const supabase = getSupabaseServer() as SupabaseClient;
  let q = supabase
    .from("simulation_sessions")
    .select("id, start_at, expires_at, status")
    .eq("id", sessionId);
  if (createdByAdminId) q = q.eq("created_by_admin_id", createdByAdminId);
  const { data: row, error } = await q.maybeSingle();
  if (error || !row) throw new Error("Invalid or missing simulation session");
  const status = deriveSessionStatus(row as { start_at: string; expires_at: string; status: string });
  if (status !== "running") throw new Error(`Simulation session not runnable: ${status}`);
  const expiresAt = (row as { expires_at: string }).expires_at;
  if (new Date(expiresAt) <= new Date()) throw new Error("Simulation session expired");
  return { id: (row as { id: string }).id, expires_at: expiresAt, status };
}

/**
 * Returns true if the current user is admin/superadmin and has an active running simulation session
 * (so they can see simulation data in preview).
 */
export async function hasActiveSimulationPreview(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const supabase = getSupabaseServer() as SupabaseClient;
  const { data: session } = await supabase
    .from("simulation_sessions")
    .select("id, start_at, expires_at, status")
    .eq("created_by_admin_id", userId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (!session?.id) return false;
  const status = deriveSessionStatus(session as { start_at: string; expires_at: string; status: string });
  return status === "running";
}

/**
 * Returns filter object for production queries: { is_simulation: false } when
 * the user should not see simulation data. Use in .eq() chain.
 * When admin has active simulation session, returns {} so they see all data.
 */
export async function getProductionSimulationFilter(): Promise<{ is_simulation?: boolean }> {
  const user = await getCurrentUser();
  if (!user?.id) return { is_simulation: false };
  const profile = await getCurrentUserProfile();
  const admin = isAdmin(profile?.role ?? null);
  if (!admin) return { is_simulation: false };
  const hasPreview = await hasActiveSimulationPreview(user.id);
  if (hasPreview) return {};
  return { is_simulation: false };
}

/**
 * Assert current user is admin/superadmin. For use in simulation lab API routes.
 */
export async function requireSimulationLabAdmin(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const profile = await getCurrentUserProfile();
  const admin = isAdmin(profile?.role ?? null);
  if (!admin) throw new Error("Forbidden: admin or superadmin required");
  return { id: user.id };
}

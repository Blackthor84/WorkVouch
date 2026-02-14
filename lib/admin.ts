/**
 * Server-safe admin role checks. Never throw.
 * Joins employer_users.profile_id → profiles.id where needed.
 * Platform roles: profiles.role + allowlists. Employer roles: employer_users.role.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { AdminRoleType } from "@/lib/permissions";
import { AdminRole } from "@/lib/permissions";

const PLATFORM_ADMIN_ROLES = ["admin", "super_admin", "superadmin"];

function getPlatformReadOnlyEmails(): string[] {
  const raw = process.env.PLATFORM_READ_ONLY_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getPlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True if email belongs to a full platform admin (profiles.role or allowlist). Never throws.
 */
export async function isPlatformAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email || typeof email !== "string" || !email.trim()) return false;
  try {
    const allowlist = getPlatformAdminEmails();
    const normalized = email.trim().toLowerCase();
    if (allowlist.length > 0 && allowlist.includes(normalized)) return true;
    const sb = getSupabaseServer();
    const { data: profile, error } = await sb
      .from("profiles")
      .select("role")
      .eq("email", normalized)
      .maybeSingle();
    if (error || !profile) return false;
    const role = (profile as { role?: string | null }).role ?? "";
    const r = role.trim().toLowerCase();
    return PLATFORM_ADMIN_ROLES.some((x) => r === x || r === x.replace("_", ""));
  } catch {
    return false;
  }
}

/**
 * True if email is platform read-only (allowlist only; no DB column). Never throws.
 */
export function isPlatformReadOnlyAdmin(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string" || !email.trim()) return false;
  const list = getPlatformReadOnlyEmails();
  if (list.length === 0) return false;
  const normalized = email.trim().toLowerCase();
  if (getPlatformAdminEmails().includes(normalized)) return false;
  return list.includes(normalized);
}

/**
 * True if email has an employer_users row for the organization. Never throws.
 */
export async function isEmployerAdmin(
  email: string | null | undefined,
  organizationId: string | null | undefined
): Promise<boolean> {
  if (!email || typeof email !== "string" || !email.trim()) return false;
  if (!organizationId || typeof organizationId !== "string" || !organizationId.trim()) return false;
  try {
    const sb = getSupabaseServer();
    const { data: profile } = await sb
      .from("profiles")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();
    if (!profile?.id) return false;
    const { data: eu, error } = await sb
      .from("employer_users")
      .select("id")
      .eq("profile_id", (profile as { id: string }).id)
      .eq("organization_id", organizationId.trim())
      .limit(1)
      .maybeSingle();
    return !error && eu != null;
  } catch {
    return false;
  }
}

/**
 * Resolves the primary admin role for the email (platform first, then employer). Never throws.
 */
export async function getAdminRole(email: string | null | undefined): Promise<AdminRoleType | null> {
  if (!email || typeof email !== "string" || !email.trim()) return null;
  try {
    const normalized = email.trim().toLowerCase();
    if (isPlatformReadOnlyAdmin(email)) return AdminRole.PLATFORM_READ_ONLY;
    if (await isPlatformAdmin(email)) return AdminRole.PLATFORM_ADMIN;
    const sb = getSupabaseServer();
    const { data: profile } = await sb
      .from("profiles")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();
    if (!profile?.id) return null;
    const { data: rows } = await sb
      .from("employer_users")
      .select("role")
      .eq("profile_id", (profile as { id: string }).id)
      .limit(10);
    const list = Array.isArray(rows) ? rows : [];
    const employerAdminRoles = ["org_admin", "location_admin", "hiring_manager"];
    const hasEmployerAdmin = list.some(
      (r) => employerAdminRoles.includes(((r as { role?: string }).role ?? "").toLowerCase())
    );
    if (list.length > 0) return hasEmployerAdmin ? AdminRole.EMPLOYER_ADMIN : AdminRole.EMPLOYER_USER;
    return null;
  } catch {
    return null;
  }
}

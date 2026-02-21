/**
 * Require superadmin for API routes. Uses Supabase auth + app_metadata.role.
 * Returns 403 Response if not superadmin; null if allowed.
 */
import type { NextResponse } from "next/server";
import { requireSuperAdminFromSupabase } from "@/lib/auth/admin-role-guards";

export async function requireSuperadmin(): Promise<NextResponse | null> {
  return requireSuperAdminFromSupabase();
}

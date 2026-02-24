/**
 * ⚠️ ADMIN ROUTE — Single source of truth for admin API auth.
 * Must use requireAdminRoute(). Do NOT use getSession() or getUserFromSession().
 *
 * Every admin API route uses this. No exceptions.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type AuthUser = { id: string; email?: string };

/**
 * Supabase Route Handler auth: getUser() + role from user_metadata (app_metadata fallback).
 * Returns { error: NextResponse } for 401/403, or { user } when allowed.
 */
export async function requireAdminRoute(): Promise<
  { error: NextResponse } | { user: AuthUser }
> {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const role =
    (user as { user_metadata?: { role?: string } }).user_metadata?.role ??
    (user as { app_metadata?: { role?: string } }).app_metadata?.role;

  if (role !== "admin" && role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: { id: user.id, email: user.email } };
}

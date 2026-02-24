/**
 * Admin auth for App Router API routes. Use this instead of getUserFromSession() for admin routes.
 * Supabase Route Handler auth: supabase.auth.getUser() + role from user_metadata (app_metadata fallback).
 *
 * Usage:
 *   const auth = await requireAdminSupabase();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user } = auth; // proceed
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export type AdminAuthUser = {
  id: string;
  email?: string;
  role: string;
};

/**
 * Returns 401/403 Response if not authenticated or not admin/superadmin; otherwise { user }.
 * Role from user.user_metadata?.role ?? user.app_metadata?.role.
 */
export async function requireAdminSupabase(): Promise<
  { user: AdminAuthUser } | NextResponse
> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const raw =
    (user as { user_metadata?: { role?: string } }).user_metadata?.role ??
    (user as { app_metadata?: { role?: string } }).app_metadata?.role;
  const role = String(raw ?? "").toLowerCase().trim();
  const allowed = role === "admin" || role === "superadmin" || role === "super_admin";

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: role === "super_admin" ? "superadmin" : role,
    },
  };
}

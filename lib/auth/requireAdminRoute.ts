/**
 * ⚠️ ADMIN ROUTE — Single source of truth for admin API auth.
 * Must use requireAdminRoute(). Do NOT use getSession() or getUserFromSession().
 *
 * Either returns a valid admin user or throws a NextResponse (401/403).
 * Usage: try { const user = await requireAdminRoute(); } catch (res) { return res; }
 */

import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";

export async function requireAdminRoute() {
  const user = await getUser();
  if (!user) {
    throw NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role =
    (user as { user_metadata?: { role?: string } }).user_metadata?.role ??
    (user as { app_metadata?: { role?: string } }).app_metadata?.role;

  if (role !== "admin" && role !== "superadmin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return user;
}

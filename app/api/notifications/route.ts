import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/notifications?limit=50
 * Session is validated via Supabase cookies (getUser); data is scoped with admin + user_id filter.
 * Client fetch: use `credentials: "include"` (same-origin cookies).
 */
export async function GET(req: Request) {
  const user = await getUser();
  console.log("[api/notifications] session user:", {
    id: user?.id ?? null,
    email: user?.email ?? null,
  });

  if (!user?.id) {
    console.log("[api/notifications] Unauthorized: missing session user");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raw = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(raw) ? Math.min(100, Math.max(1, raw)) : 50;

  const { data, error } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
      return NextResponse.json({ notifications: [] });
    }
    console.error("[api/notifications] query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data ?? [] });
}

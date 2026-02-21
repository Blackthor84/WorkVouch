/**
 * GET /api/activity — current user's activity_log (effective user when impersonating).
 * Requires authenticated user. Returns rows ordered by created_at desc, limit 50.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";

export const dynamic = "force-dynamic";

export async function GET() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, target, metadata, created_at")
    .eq("user_id", effectiveUserId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * GET /api/resumes
 * Lists current user's resumes (id, file_path, status, parsed_data, created_at).
 * Production only: no demo/sandbox resumes unless env allows.
 */

import { NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseServer();
    const { data, error } = await sb
      .from("resumes")
      .select("id, user_id, organization_id, file_path, status, parsed_data, parsing_error, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[resumes] list error:", error);
      return NextResponse.json({ error: "Failed to list resumes" }, { status: 500 });
    }

    return NextResponse.json({ resumes: data ?? [] });
  } catch (e) {
    console.error("[resumes] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/resumes
 * Lists current user's resumes. Production-safe: uses getUser(), no getSession(), no uncaught errors.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("resumes")
      .select("id, user_id, organization_id, file_path, status, parsed_data, parsing_error, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[resumes] list error:", error.message ?? error);
      return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
    }

    return NextResponse.json({ resumes: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[resumes] error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

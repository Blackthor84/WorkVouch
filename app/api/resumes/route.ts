/**
 * GET /api/resumes
 * Lists current user's resumes. Production-safe: no getSession(), no uncaught errors.
 * Force Node runtime to avoid Edge/cookies() issues on Vercel.
 */

// Log when this module is loaded (helps confirm route resolution and catch import crashes)
console.error("[resumes] ROUTE MODULE LOADED");

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.error("[resumes] GET invoked");

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error("[resumes] Missing env: URL=" + (url ? "set" : "MISSING") + ", ANON_KEY=" + (anonKey ? "set" : "MISSING"));
      return NextResponse.json({ error: "Service misconfigured" }, { status: 503 });
    }

    const supabase = await supabaseServer();
    const authResult = await supabase.auth.getUser();
    const user = authResult?.data?.user ?? null;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("resumes")
      .select("id, user_id, organization_id, file_path, status, parsed_data, parsing_error, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[resumes] list error:", error.message ?? String(error));
      return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
    }

    return NextResponse.json({ resumes: Array.isArray(data) ? data : [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[resumes] GET error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

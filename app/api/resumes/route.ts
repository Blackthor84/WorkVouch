/**
 * GET /api/resumes
 * Lists current user's resumes. Production-safe: no getSession(), no unsafe destructuring, no uncaught errors.
 *
 * LIKELY CAUSE OF 500: Destructuring `const { data: { user } } = await supabase.auth.getUser()`
 * throws if `data` is undefined (e.g. auth error or unexpected response). Use safe access instead.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[resumes] Missing Supabase env (URL or ANON_KEY)");
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
    console.error("[resumes] error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

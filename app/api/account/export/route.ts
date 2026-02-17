/**
 * GET /api/account/export
 * Server-side only. Returns the current user's data as JSON for download.
 * Auth required; only the authenticated user's data is returned.
 */

import { NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { session } = await getSupabaseSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    const [profileRes, employmentRes] = await Promise.all([
      supabaseAny
        .from("profiles")
        .select("id, full_name, email, role, industry, created_at, updated_at")
        .eq("id", userId)
        .single(),
      supabaseAny
        .from("employment_records")
        .select("id, company_name, job_title, start_date, end_date, created_at")
        .eq("user_id", userId)
        .order("start_date", { ascending: false }),
    ]);

    const profile = profileRes.data ?? null;
    const employment_records = employmentRes.data ?? [];

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile,
      employment_records,
    };

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="workvouch-data-${userId.slice(0, 8)}-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    console.error("[account/export]", err);
    return NextResponse.json(
      { error: "Failed to export data. Please try again." },
      { status: 500 }
    );
  }
}

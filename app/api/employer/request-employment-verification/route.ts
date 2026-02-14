/**
 * POST /api/employer/request-employment-verification
 * Employer requests verification for a listed employment record. Notifies employee; does not change verification_status.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { hasRole } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  record_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const adminSupabase = getSupabaseServer() as any;

    const { data: account } = await supabaseAny.from("employer_accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;

    const { data: rec, error: fetchErr } = await adminSupabase
      .from("employment_records")
      .select("id, user_id, employer_id")
      .eq("id", parsed.data.record_id)
      .single();

    if (fetchErr || !rec) return NextResponse.json({ error: "Employment record not found" }, { status: 404 });

    const row = rec as { employer_id: string | null; user_id: string };
    if (row.employer_id !== employerId) {
      return NextResponse.json({ error: "You can only request verification for your own company" }, { status: 403 });
    }

    await adminSupabase.from("employer_notifications").insert({
      employer_id: employerId,
      type: "verification_requested",
      related_user_id: row.user_id,
      related_record_id: parsed.data.record_id,
      read: false,
    });

    const { triggerProfileIntelligence } = await import("@/lib/intelligence/engines");
    try {
      await triggerProfileIntelligence(row.user_id);
    } catch (err: unknown) {
      console.error("[API][request-employment-verification] triggerProfileIntelligence", { userId: row.user_id, err });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[API][request-employment-verification]", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

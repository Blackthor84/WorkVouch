/**
 * POST /api/employer/claim-request
 * Submit a request to claim an employer account (company). Admin must approve.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  employer_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { employer_id } = parsed.data;
    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const adminSupabase = getSupabaseServer() as any;

    const { data: employer } = await adminSupabase
      .from("employer_accounts")
      .select("id, user_id, company_name, claimed, claim_verified")
      .eq("id", employer_id)
      .single();

    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const acc = employer as { user_id: string; claimed?: boolean; claim_verified?: boolean };
    if (acc.claimed && acc.claim_verified) {
      return NextResponse.json({ error: "This company is already claimed and verified" }, { status: 400 });
    }

    const { data: existing } = await adminSupabase
      .from("employer_claim_requests")
      .select("id, status")
      .eq("employer_id", employer_id)
      .eq("requested_by_user_id", user.id)
      .in("status", ["pending"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You already have a pending claim request for this company" }, { status: 400 });
    }

    const { data: inserted, error } = await adminSupabase
      .from("employer_claim_requests")
      .insert({
        employer_id,
        requested_by_user_id: user.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[employer/claim-request]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await supabase
        .from("employer_claim_verification_audit")
        .insert({
          event_type: "claim_request",
          employer_account_id: employer_id,
          actor_id: user.id,
          payload: { claim_request_id: (inserted as { id: string }).id },
        });
    } catch (e) {
      console.error("[audit]", e);
    }

    return NextResponse.json({ success: true, claim_request_id: (inserted as { id: string }).id });
  } catch (e) {
    console.error("[employer/claim-request]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  companyId: z.string().uuid(),
  industryType: z.string().min(1).default("general"),
  tenureWeight: z.number().min(0).optional(),
  referenceWeight: z.number().min(0).optional(),
  rehireWeight: z.number().min(0).optional(),
  disputeWeight: z.number().min(0).optional(),
  gapWeight: z.number().min(0).optional(),
  fraudWeight: z.number().min(0).optional(),
  overrideEnabled: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isSuperAdmin(role)) return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

    const data = bodySchema.parse(await req.json());
    const supabase = getSupabaseServer() as any;

    const row: Record<string, unknown> = {
      company_id: data.companyId,
      industry_type: data.industryType,
      override_enabled: data.overrideEnabled,
    };
    if (data.tenureWeight != null) row.tenure_weight = data.tenureWeight;
    if (data.referenceWeight != null) row.reference_weight = data.referenceWeight;
    if (data.rehireWeight != null) row.rehire_weight = data.rehireWeight;
    if (data.disputeWeight != null) row.dispute_weight = data.disputeWeight;
    if (data.gapWeight != null) row.gap_weight = data.gapWeight;
    if (data.fraudWeight != null) row.fraud_weight = data.fraudWeight;

    const { data: existing } = await supabase.from("risk_model_configs").select("id").eq("company_id", data.companyId).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("risk_model_configs").update(row).eq("company_id", data.companyId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from("risk_model_configs").insert(row);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction({
      admin_profile_id: user.id,
      action: "enterprise_risk_model_setup",
      target_type: "organization",
      target_id: data.companyId,
      new_value: { companyId: data.companyId, overrideEnabled: data.overrideEnabled },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input", details: e.issues }, { status: 400 });
    console.error("[setup-risk-model]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

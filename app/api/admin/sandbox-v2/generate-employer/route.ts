import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { createSandboxProfile } from "@/lib/sandbox/createSandboxProfile";
import { INDUSTRIES } from "@/lib/constants/industries";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { isSandboxMutationsEnabled } from "@/lib/server/sandboxMutations";

export const dynamic = "force-dynamic";

const COMPANY_NAMES = [
  "Acme Corp", "Beta Industries", "Gamma Labs", "Delta Solutions", "Epsilon Tech",
  "Zenith Partners", "Apex Consulting", "Nova Systems", "Prime Holdings", "Summit Group",
];
const PLAN_TIERS = ["starter", "pro", "custom"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  try {
    if (!isSandboxMutationsEnabled()) {
      return NextResponse.json({ success: false, error: "Sandbox mutations are disabled" }, { status: 403 });
    }
    const adminSession = await requireSandboxV2AdminWithRole();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    if (!sandboxId || typeof sandboxId !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid sandboxId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: session, error: sessionError } = await supabase
      .from("sandbox_sessions")
      .select("id, status")
      .eq("id", sandboxId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
    }
    if (!session || session.status !== "active") {
      return NextResponse.json({ success: false, error: "Sandbox not found or not active" }, { status: 400 });
    }

    const company_name = pick(COMPANY_NAMES);
    const industry = pick(INDUSTRIES);
    const plan_tier = pick(PLAN_TIERS);

    const profileId = await createSandboxProfile(supabase, {
      full_name: company_name,
      role: "employer",
      sandbox_id: sandboxId,
    });
    const { data, error } = await supabase
      .from("sandbox_employers")
      .insert({ sandbox_id: sandboxId, company_name, industry, plan_tier, profile_id: profileId })
      .select("id, company_name, industry, plan_tier, profile_id")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const serverSupabase = await supabaseServer();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await writeAdminAuditLog({
      admin_user_id: adminSession.id,
      admin_email: user?.email ?? null,
      admin_role: adminSession.isSuperAdmin ? "superadmin" : "admin",
      action_type: "sandbox_spawn_employer",
      target_type: "system",
      target_id: data.id,
      before_state: null,
      after_state: { sandbox_id: sandboxId, employer_id: data.id, company_name: data.company_name },
      reason: "sandbox_playground_spawn_employer",
      is_sandbox: true,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });
    console.log("Sandbox employer generated:", data?.id);
    return NextResponse.json({
      success: true,
      employer: { ...data, userId: data?.profile_id ?? data?.id },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

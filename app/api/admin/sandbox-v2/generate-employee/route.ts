import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { createSandboxProfile } from "@/lib/sandbox/createSandboxProfile";
import { INDUSTRIES } from "@/lib/constants/industries";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { isSandboxMutationsEnabled } from "@/lib/server/sandboxMutations";

export const dynamic = "force-dynamic";

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Blake"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"];
const JOB_TITLES = ["Engineer", "Analyst", "Manager", "Designer", "Developer", "Consultant", "Specialist", "Coordinator"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

    const { data: employers } = await supabase
      .from("sandbox_employers")
      .select("id")
      .eq("sandbox_id", sandboxId)
      .limit(100);

    const first_name = pick(FIRST_NAMES);
    const last_name = pick(LAST_NAMES);
    const full_name = `${first_name} ${last_name}`;
    const job_title = pick(JOB_TITLES);
    const tenure_months = randomInt(6, 60);

    const profileId = await createSandboxProfile(supabase, {
      full_name,
      role: "user",
      sandbox_id: sandboxId,
    });
    const { data: employee, error: empError } = await supabase
      .from("sandbox_employees")
      .insert({ sandbox_id: sandboxId, full_name, industry: pick(INDUSTRIES), profile_id: profileId })
      .select("id, full_name, industry, profile_id")
      .single();

    if (empError) {
      return NextResponse.json({ success: false, error: empError.message }, { status: 500 });
    }

    if (employers?.length && employers.length > 0) {
      const employerId = pick(employers).id;
      await supabase.from("sandbox_employment_records").insert({
        sandbox_id: sandboxId,
        employee_id: employee.id,
        employer_id: employerId,
        role: job_title,
        tenure_months,
        rehire_eligible: true,
      });
    }

    const recalc = await runSandboxIntelligenceRecalculation(sandboxId);
    if (!recalc.ok) {
      return NextResponse.json(
        { success: false, error: recalc.error ?? "Recalculation failed" },
        { status: 500 }
      );
    }

    const { data: intelRow } = await supabase
      .from("sandbox_intelligence_outputs")
      .select("profile_strength, career_health, risk_index, team_fit, hiring_confidence, network_density")
      .eq("sandbox_id", sandboxId)
      .eq("employee_id", employee.id)
      .maybeSingle();

    const intelligence = intelRow
      ? {
          profile_strength: intelRow.profile_strength ?? 0,
          career_health: intelRow.career_health ?? 0,
          risk_index: intelRow.risk_index ?? 0,
          team_fit: intelRow.team_fit ?? 0,
          hiring_confidence: intelRow.hiring_confidence ?? 0,
          network_density: intelRow.network_density ?? 0,
        }
      : null;

    const serverSupabase = await supabaseServer();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await writeAdminAuditLog({
      admin_user_id: adminSession.id,
      admin_email: user?.email ?? null,
      admin_role: adminSession.isSuperAdmin ? "superadmin" : "admin",
      action_type: "sandbox_spawn_worker",
      target_type: "system",
      target_id: employee.id,
      before_state: null,
      after_state: { sandbox_id: sandboxId, employee_id: employee.id, full_name: employee.full_name },
      reason: "sandbox_playground_spawn_worker",
      is_sandbox: true,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });

    return NextResponse.json({
      success: true,
      employee: { ...employee, userId: employee.profile_id ?? employee.id },
      intelligence,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

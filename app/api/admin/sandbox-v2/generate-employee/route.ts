import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { INDUSTRIES_OPTIONS } from "@/lib/constants/industries";

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
    await requireSandboxV2Admin();
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

    const { data: employee, error: empError } = await supabase
      .from("sandbox_employees")
      .insert({ sandbox_id: sandboxId, full_name, industry: pick(INDUSTRIES_OPTIONS) })
      .select("id, full_name, industry")
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

    return NextResponse.json({ success: true, employee, intelligence });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

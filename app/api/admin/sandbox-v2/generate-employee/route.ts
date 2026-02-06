import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

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
    const reference_score = randomInt(50, 100);

    const { data: employee, error: empError } = await supabase
      .from("sandbox_employees")
      .insert({ sandbox_id: sandboxId, full_name, industry: "Technology" })
      .select("id, full_name, industry")
      .single();

    if (empError) {
      return NextResponse.json({ success: false, error: empError.message }, { status: 500 });
    }

    const profile_strength = Math.round(reference_score * 0.8 * 10) / 10;
    const career_health = Math.min(100, Math.round(tenure_months * 1.2 * 10) / 10);
    const risk_index = Math.round((100 - reference_score) * 10) / 10;
    const team_fit = randomInt(60, 95);
    const hiring_confidence = Math.round((profile_strength + team_fit) / 2 * 10) / 10;
    const network_density = randomInt(40, 90);

    const { error: intelError } = await supabase.from("sandbox_intelligence_outputs").upsert(
      {
        sandbox_id: sandboxId,
        employee_id: employee.id,
        profile_strength,
        career_health,
        risk_index,
        team_fit,
        hiring_confidence,
        network_density,
      },
      { onConflict: "sandbox_id,employee_id" }
    );

    if (intelError) {
      return NextResponse.json({ success: false, error: intelError.message }, { status: 500 });
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

    const intelligence = {
      profile_strength,
      career_health,
      risk_index,
      team_fit,
      hiring_confidence,
      network_density,
    };

    console.log("Sandbox employee generated:", employee?.id);
    return NextResponse.json({ success: true, employee, intelligence });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

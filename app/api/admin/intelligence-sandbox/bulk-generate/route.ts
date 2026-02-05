/**
 * POST /api/admin/intelligence-sandbox/bulk-generate
 * Bulk creates sandbox employees/employers with random realistic names and industries.
 * Types: 10_employees | 50_employees | 1_employer_25_employees | 500_org
 * All rows include sandbox_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";
import { runCandidateIntelligence } from "@/lib/intelligence/runIntelligencePipeline";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { persistUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";
import type { SimulationContext } from "@/lib/simulation/types";

export const dynamic = "force-dynamic";

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Jamie", "Dakota", "Reese", "Avery", "Skyler", "Parker", "Cameron"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore"];
const INDUSTRIES = ["technology", "healthcare", "finance", "retail", "logistics", "hospitality", "corporate", "security"];
const JOB_TITLES = ["Associate", "Specialist", "Coordinator", "Analyst", "Representative", "Supervisor", "Lead", "Manager"];
const COMPANY_PREFIXES = ["Acme", "Summit", "Vertex", "Nexus", "Apex", "Prime", "Core", "Pinnacle"];
const COMPANY_SUFFIXES = ["Corp", "Inc", "Group", "Solutions", "Industries", "Labs", "Systems"];

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomCompany(): string {
  return `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
}

async function createOneEmployee(
  supabase: ReturnType<typeof getSupabaseServer>,
  sandboxId: string,
  context: SimulationContext,
  overrides: { full_name?: string; industry?: string; company_name?: string } = {}
): Promise<{ user_id: string } | null> {
  const fullName = overrides.full_name ?? randomName();
  const industry = overrides.industry ?? pick(INDUSTRIES);
  const companyName = overrides.company_name ?? randomCompany();
  const suffix = randomSuffix();
  const email = `sandbox-${sandboxId.slice(0, 8)}-${suffix}@sandbox.local`;

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: `Sand${suffix}!Sec`,
    email_confirm: true,
  });
  if (authError || !authUser?.user?.id) return null;
  const userId = authUser.user.id;

  const companyNormalized = companyName.toLowerCase().trim();
  await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      email,
      sandbox_id: sandboxId,
      updated_at: new Date().toISOString(),
      professional_summary: industry ? `Industry: ${industry}` : undefined,
    },
    { onConflict: "id" }
  );

  await supabase.from("user_roles").upsert(
    { user_id: userId, role: "user" },
    { onConflict: "user_id,role" }
  );

  const startDate = new Date(Date.now() - Math.random() * 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { error: erErr } = await supabase.from("employment_records").insert({
    user_id: userId,
    company_name: companyName,
    company_normalized: companyNormalized,
    job_title: pick(JOB_TITLES),
    start_date: startDate,
    end_date: null,
    is_current: true,
    verification_status: "verified",
    rehire_eligible: Math.random() > 0.3,
    sandbox_id: sandboxId,
  });

  if (erErr) {
    await supabase.auth.admin.deleteUser(userId);
    return null;
  }

  await calculateUserIntelligence(userId, context);
  await runCandidateIntelligence(userId, context);
  await persistUnifiedIntelligence(userId, context);
  return { user_id: userId };
}

async function createOneEmployer(
  supabase: ReturnType<typeof getSupabaseServer>,
  sandboxId: string
): Promise<{ employer_id: string; company_name: string } | null> {
  const companyName = randomCompany();
  const suffix = randomSuffix();
  const email = `sandbox-employer-${sandboxId.slice(0, 8)}-${suffix}@sandbox.local`;

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: `SandEmp${suffix}!Sec`,
    email_confirm: true,
  });
  if (authError || !authUser?.user?.id) return null;
  const userId = authUser.user.id;

  await supabase.from("profiles").upsert(
    { id: userId, full_name: companyName, email, sandbox_id: sandboxId, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );

  await supabase.from("user_roles").upsert(
    { user_id: userId, role: "employer" },
    { onConflict: "user_id,role" }
  );

  const { data: eaRow, error: eaErr } = await supabase
    .from("employer_accounts")
    .insert({
      user_id: userId,
      company_name: companyName,
      industry_type: pick(INDUSTRIES),
      plan_tier: "pro",
      sandbox_id: sandboxId,
      reports_used: 0,
      searches_used: 0,
    })
    .select("id")
    .single();

  if (eaErr) {
    await supabase.auth.admin.deleteUser(userId);
    return null;
  }

  const employerId = (eaRow as { id: string })?.id ?? userId;
  return { employer_id: employerId, company_name: companyName };
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const type = (body.type as string) || "10_employees";

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }

    const sandbox = await validateSandboxForWrite(sandboxId, adminId);
    const context: SimulationContext = { expiresAt: sandbox.ends_at, sandboxId };
    const supabase = getSupabaseServer();

    const counts = { employees: 0, employers: 0 };

    if (type === "10_employees") {
      for (let i = 0; i < 10; i++) {
        const r = await createOneEmployee(supabase, sandboxId, context);
        if (r) counts.employees++;
      }
    } else if (type === "50_employees") {
      for (let i = 0; i < 50; i++) {
        const r = await createOneEmployee(supabase, sandboxId, context);
        if (r) counts.employees++;
      }
    } else if (type === "1_employer_25_employees") {
      const emp = await createOneEmployer(supabase, sandboxId);
      if (emp) {
        counts.employers = 1;
        for (let i = 0; i < 25; i++) {
          const r = await createOneEmployee(supabase, sandboxId, context, { company_name: emp.company_name });
          if (r) counts.employees++;
        }
      }
    } else if (type === "500_org") {
      const employers: { company_name: string }[] = [];
      for (let e = 0; e < 5; e++) {
        const emp = await createOneEmployer(supabase, sandboxId);
        if (emp) {
          counts.employers++;
          employers.push({ company_name: emp.company_name });
        }
      }
      for (let i = 0; i < 500; i++) {
        const company = employers.length ? pick(employers).company_name : randomCompany();
        const r = await createOneEmployee(supabase, sandboxId, context, { company_name: company });
        if (r) counts.employees++;
      }
    } else {
      return NextResponse.json({ error: "Invalid type. Use 10_employees | 50_employees | 1_employer_25_employees | 500_org" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, type, ...counts });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

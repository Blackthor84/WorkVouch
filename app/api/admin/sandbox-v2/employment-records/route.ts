import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const employee_id = (body.employee_id ?? body.employeeId) as string | undefined;
    const employer_id = (body.employer_id ?? body.employerId) as string | undefined;
    const role = (body.role as string) ?? null;
    const tenure_months = typeof body.tenure_months === "number" ? body.tenure_months : typeof body.tenure_months === "string" ? parseInt(body.tenure_months, 10) : null;
    const rehire_eligible = typeof body.rehire_eligible === "boolean" ? body.rehire_eligible : body.rehire_eligible === "true" || body.rehire_eligible === true;

    if (!sandbox_id || !employee_id || !employer_id) return NextResponse.json({ error: "Missing sandbox_id, employee_id, or employer_id" }, { status: 400 });

    const { data, error } = await sb()
      .from("sandbox_employment_records")
      .insert({ sandbox_id, employee_id, employer_id, role, tenure_months, rehire_eligible })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, record: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

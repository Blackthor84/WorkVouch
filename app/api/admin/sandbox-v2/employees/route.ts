import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const full_name = (body.full_name ?? body.fullName) ?? "Sandbox Employee";
    const industry = (body.industry as string) ?? null;

    if (!sandbox_id) return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });

    const { data, error } = await getSupabaseServer()
      .from("sandbox_employees")
      .insert({ sandbox_id, full_name, industry })
      .select("id, full_name, industry")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, employee: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

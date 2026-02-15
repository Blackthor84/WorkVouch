/**
 * GET playbook report by id (for export). Sandbox only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSandboxV2AdminWithRole();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const sb = getSupabaseServer();
    const { data, error } = await sb.from("sandbox_stress_test_reports").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({ success: true, report: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

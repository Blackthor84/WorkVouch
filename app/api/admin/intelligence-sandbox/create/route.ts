/**
 * POST /api/admin/intelligence-sandbox/create
 * Creates an intelligence sandbox. Never returns 400; always structured JSON.
 * Body: name?, startTime?/startsAt?, endTime?/endsAt?
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin } from "@/lib/sandbox";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("Sandbox CREATE hit");

    let adminId: string;
    try {
      const admin = await requireSandboxAdmin();
      adminId = admin.id;
    } catch {
      console.error("Sandbox create: auth required");
      return NextResponse.json({ success: false, message: "Auth required", sandbox: null });
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const name = (typeof body.name === "string" ? body.name : null) || "Sandbox";
    const startRaw = body.startTime ?? body.startsAt ?? body.starts_at;
    const endRaw = body.endTime ?? body.endsAt ?? body.ends_at;
    const now = new Date();
    const startTime = startRaw ? new Date(startRaw as string) : now;
    const endTime = endRaw ? new Date(endRaw as string) : new Date(now.getTime() + 60 * 60 * 1000);

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("intelligence_sandboxes")
      .insert({
        name,
        created_by: adminId,
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Sandbox create error:", error);
      return NextResponse.json({ success: false, message: error.message, sandbox: null });
    }

    return NextResponse.json({ success: true, sandbox: data, id: data?.id });
  } catch (err) {
    console.error("Sandbox CREATE fatal error:", err);
    return NextResponse.json({ success: false, sandbox: null });
  }
}

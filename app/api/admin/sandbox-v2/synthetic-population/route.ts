/**
 * POST/GET /api/admin/sandbox-v2/synthetic-population — generate or list synthetic populations.
 * Sandbox only. Synthetic data never leaves sandbox; clearly labeled.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { generateSyntheticPopulation, listSyntheticPopulations } from "@/lib/sandbox/synthetic/generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2AdminWithRole();
    const sandboxId = req.nextUrl.searchParams.get("sandbox_id");
    if (!sandboxId) return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    const list = await listSyntheticPopulations(sandboxId);
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId, isSuperAdmin } = await requireSandboxV2AdminWithRole();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id ?? body.sandboxId;
    if (!sandboxId) return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    const params = {
      user_count: Math.min(5000, Math.max(1, Number(body.user_count) || 100)),
      employer_count: Math.min(500, Math.max(1, Number(body.employer_count) || 10)),
      overlap_density: body.overlap_density,
      pct_malicious: body.pct_malicious,
      pct_collusion_clusters: body.pct_collusion_clusters,
      review_behavior: body.review_behavior ?? "normal",
    };
    const result = await generateSyntheticPopulation({
      sandboxId,
      name: body.name,
      params,
      createdBy: userId,
    });
    if (!result) return NextResponse.json({ error: "Failed to generate population" }, { status: 500 });
    await writeAdminAuditLog({
      admin_user_id: userId,
      admin_email: null,
      admin_role: isSuperAdmin ? "superadmin" : "admin",
      action_type: "SANDBOX_SYNTHETIC_POPULATION",
      target_type: "system",
      target_id: result.id,
      before_state: null,
      after_state: { sandbox_id: sandboxId, user_count: result.userCount, employer_count: result.employerCount, params },
      reason: "Synthetic population generated in sandbox. Data never leaves sandbox.",
      is_sandbox: true,
    });
    return NextResponse.json({
      success: true,
      id: result.id,
      user_count: result.userCount,
      employer_count: result.employerCount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

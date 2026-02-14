import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { generateTemplateByKey } from "@/lib/sandbox/templateEngine";

export const dynamic = "force-dynamic";

/** POST /api/admin/sandbox-v2/generate-template — deploy template into session */
export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const templateKey = (body.template_key ?? body.templateKey) as string | undefined;
    const employeeCountOverride =
      typeof body.employee_count_override === "number"
        ? body.employee_count_override
        : typeof body.employeeCountOverride === "number"
          ? body.employeeCountOverride
          : undefined;

    if (!sandboxId || !templateKey)
      return NextResponse.json({ error: "Missing sandbox_id and template_key" }, { status: 400 });

    const result = await generateTemplateByKey(sandboxId, templateKey, employeeCountOverride);
    if (!result.ok) return NextResponse.json({ error: result.error ?? "Template generation failed" }, { status: 400 });
    return NextResponse.json({
      success: true,
      stats: result.stats,
      message: `Template deployed: ${result.stats?.employees ?? 0} employees, ${result.stats?.reviews ?? 0} reviews, intelligence and revenue/ads simulated.`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  fraudFlagId: z.string().uuid().optional(),
  status: z.enum(["clear", "confirmed", "escalate"]),
  notes: z.string().max(5000).optional().nullable(),
  checklist: z
    .object({
      reviewedIpLogs: z.boolean().optional(),
      checkedEmploymentOverlap: z.boolean().optional(),
      checkedCircularReferences: z.boolean().optional(),
      reviewedEmployerComplaints: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sb = getSupabaseServer() as any;
    const entityId = parsed.data.fraudFlagId ?? crypto.randomUUID();

    await sb.from("audit_logs").insert({
      entity_type: "fraud_investigation",
      entity_id: entityId,
      changed_by: user.id,
      old_value: null,
      new_value: {
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        checklist: parsed.data.checklist ?? null,
      },
      change_reason: parsed.data.notes ?? "Fraud workflow step",
    });

    return NextResponse.json({
      ok: true,
      entityId,
      status: parsed.data.status,
    });
  } catch (e) {
    console.error("[admin/fraud-workflow/log] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/profile
 * Save profile fields during the canonical onboarding wizard.
 */
export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      industry?: string;
      professional_summary?: string;
      vertical_metadata?: Record<string, unknown>;
    };

    const update: Record<string, unknown> = {};
    if (typeof body.industry === "string" && body.industry.trim()) {
      update.industry = body.industry.trim();
    }
    if (typeof body.professional_summary === "string") {
      update.professional_summary = body.professional_summary.trim();
    }
    if (body.vertical_metadata != null && typeof body.vertical_metadata === "object") {
      update.vertical_metadata = body.vertical_metadata;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
    }

    const { error } = await admin.from("profiles").update(update).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[onboarding/profile]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/onboarding/vouch/job
 * Minimal job: company + role only (sensible defaults for dates).
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { saveOnboardingVouchJob } from "@/lib/jobs/productionSafeJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (String((roleRow as { role?: string } | null)?.role ?? "").toLowerCase() === "employer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const company = typeof body.company_name === "string" ? body.company_name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (company.length < 1 || role.length < 1) {
      return NextResponse.json({ error: "Company and role are required" }, { status: 400 });
    }

    const startIso = new Date().toISOString().slice(0, 10);
    const { result, error } = await saveOnboardingVouchJob(admin as Parameters<typeof saveOnboardingVouchJob>[0], {
      userId: user.id,
      companyName: company,
      role,
      startDate: startIso,
    });

    if (error || !result) {
      console.error("[onboarding/vouch/job]", error);
      return NextResponse.json({ error: error?.message ?? "Failed to save job" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      job: result.job,
      visibility: result.visibility,
      persistedVisibility: result.persistedVisibility,
    });
  } catch (e) {
    console.error("[onboarding/vouch/job]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import { saveOnboardingProfileFields } from "@/lib/onboarding/onboardingProfileFields";

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

    const hasIndustry = typeof body.industry === "string" && body.industry.trim().length > 0;
    const hasSummary = typeof body.professional_summary === "string";
    const hasVertical =
      body.vertical_metadata != null && typeof body.vertical_metadata === "object";

    if (!hasIndustry && !hasSummary && !hasVertical) {
      return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
    }

    const result = await saveOnboardingProfileFields(user.id, body);

    if (
      hasSummary &&
      !result.persisted.professional_summary &&
      typeof body.professional_summary === "string" &&
      body.professional_summary.trim().length > 0
    ) {
      return NextResponse.json({ error: "Could not save profile summary" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[onboarding/profile]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

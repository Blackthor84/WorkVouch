// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/employer/legal-acceptance
 * Record employer legal disclaimer acceptance. Required before candidate search / profile view.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import { EMPLOYER_DISCLAIMER_VERSION } from "@/lib/employer/requireEmployerLegalAcceptance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json(
        { error: "Employer access required" },
        { status: 403 },
      );
    }
    const { error } = await admin.from("employer_legal_acceptance").upsert(
      {
        profile_id: user.id,
        version: EMPLOYER_DISCLAIMER_VERSION,
        accepted_at: new Date().toISOString(),
      },
      {
        onConflict: "profile_id,version",
      },
    );

    if (error) {
      console.error("[employer/legal-acceptance]", error);
      return NextResponse.json(
        { error: "Failed to record acceptance" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[employer/legal-acceptance]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

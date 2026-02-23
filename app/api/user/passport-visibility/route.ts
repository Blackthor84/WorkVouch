/**
 * PATCH /api/user/passport-visibility
 * Set Verified Work Profile visibility. Body: { visibility: "private" | "verified_employers" | "shared_network" | "public" }
 * Maps to: is_public_passport, searchable_by_verified_employers, searchable_by_shared_employers.
 * Tier gating: Lite = private or shared_network only; Pro = + verified_employers; Enterprise (when flag) = + public.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/feature-flags";

const VISIBILITY_OPTIONS = ["private", "verified_employers", "shared_network", "public"] as const;
type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number];

function parseVisibility(body: unknown): VisibilityOption {
  const v = body && typeof body === "object" && "visibility" in body && typeof (body as any).visibility === "string"
    ? (body as any).visibility.toLowerCase().replace(/-/g, "_")
    : "";
  if (VISIBILITY_OPTIONS.includes(v as VisibilityOption)) return v as VisibilityOption;
  return "private";
}

export async function PATCH(req: NextRequest) {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const visibility = parseVisibility(await req.json().catch(() => ({})));

    const sb = getSupabaseServer() as any;
    const { data: sub } = await sb
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", effective.id)
      .or("status.eq.active,status.eq.trialing")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    const employeeTier = ((sub as { tier?: string } | null)?.tier ?? "free").toLowerCase().replace(/-/g, "_");

    const publicPassportEnabled = await checkFeatureAccess("public_passport_enabled", { userId: effective.id });

    if (visibility === "public") {
      if (!publicPassportEnabled) {
        return NextResponse.json(
          { error: "Full public passport is not available for your plan. Upgrade or contact support." },
          { status: 403 }
        );
      }
      if (employeeTier !== "emp_enterprise" && employeeTier !== "enterprise" && employeeTier !== "custom") {
        return NextResponse.json(
          { error: "Full public passport requires Custom or higher. Upgrade to unlock." },
          { status: 403 }
        );
      }
    }

    if (visibility === "verified_employers") {
      const employerSearchEnabled = await checkFeatureAccess("employer_search_enabled", { userId: effective.id });
      if (!employerSearchEnabled && employeeTier !== "emp_pro" && employeeTier !== "pro" && employeeTier !== "emp_enterprise" && employeeTier !== "enterprise" && employeeTier !== "custom") {
        return NextResponse.json(
          { error: "Visible to verified employers requires Pro or higher." },
          { status: 403 }
        );
      }
    }

    const is_public_passport = visibility === "public";
    const searchable_by_verified_employers =
      visibility === "public" || visibility === "verified_employers";
    const searchable_by_shared_employers =
      visibility === "public" || visibility === "verified_employers" || visibility === "shared_network";

    const serverSupabase = await createServerSupabase();
    const serverSb = serverSupabase as any;

    const updatePayload: Record<string, boolean> = {
      is_public_passport,
      searchable_by_verified_employers,
      searchable_by_shared_employers,
    };
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: true, visibility });
    }

    const { error } = await serverSb
      .from("profiles")
      .update(updatePayload)
      .eq("id", effective.id);

    if (error) {
      if ((error as any).code === "42703") {
        return NextResponse.json(
          { error: "Visibility columns not yet migrated. Run work_passport_visibility.sql." },
          { status: 501 }
        );
      }
      console.error("Passport visibility error:", error);
      return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      visibility,
      is_public_passport,
      searchable_by_verified_employers,
      searchable_by_shared_employers,
    });
  } catch (e) {
    console.error("Passport visibility error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

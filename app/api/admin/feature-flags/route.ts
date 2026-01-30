import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
}

function isSuperAdmin(roles: string[]): boolean {
  return roles.includes("superadmin");
}

/** Core feature flags that must always exist. Insert if missing (by key). visibility_type uses "both" or "ui" (DB allows ui|api|both). */
const CORE_FEATURE_FLAGS = [
  { name: "Ads System", key: "ads_system", description: "Controls visibility of advertising system", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "Beta Access", key: "beta_access", description: "Controls beta feature visibility", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "Advanced Analytics", key: "advanced_analytics", description: "Controls advanced employer analytics", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "Reference Consistency Index", key: "reference_consistency", description: "Reference Alignment Score from peer feedback consistency", visibility_type: "ui" as const, is_globally_enabled: false, required_subscription_tier: "emp_pro" },
  { name: "Workforce Stability Indicator", key: "stability_index", description: "Employment stability from tenure and peer confirmation", visibility_type: "ui" as const, is_globally_enabled: false, required_subscription_tier: "emp_lite" },
  { name: "Environment Fit Indicator", key: "environment_fit_indicator", description: "Environment fit from peer feedback and patterns", visibility_type: "ui" as const, is_globally_enabled: false, required_subscription_tier: "emp_pro" },
  { name: "Rehire Probability Index", key: "rehire_probability_index", description: "Rehire probability widget on employer dashboard", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "Workforce Risk Indicator", key: "workforce_risk_indicator", description: "Workforce risk indicator on employer dashboard", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "Team Compatibility Scoring", key: "team_compatibility_scoring", description: "Team compatibility scoring", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "Integrity Index", key: "integrity_index", description: "Integrity index scoring", visibility_type: "both" as const, is_globally_enabled: false },
  { name: "AI Reference Summaries", key: "ai_reference_summaries", description: "AI-generated reference summaries", visibility_type: "both" as const, is_globally_enabled: false },
];

/**
 * GET /api/admin/feature-flags
 * List all feature flags (Admin + SuperAdmin). Includes key, required_subscription_tier, assignments count.
 * Auto-seeds core flags (ads_system, beta_access, advanced_analytics) if they do not exist.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as any).roles || [];
    if (!isAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer();
    let { data: flags, error } = await (supabase as any)
      .from("feature_flags")
      .select("*")
      .order("name");

    if (error) {
      console.error("Feature flags fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const existingKeys = new Set((flags || []).map((f: { key?: string }) => f.key));
    for (const core of CORE_FEATURE_FLAGS) {
      if (!existingKeys.has(core.key)) {
        const { error: insertErr } = await (supabase as any)
          .from("feature_flags")
          .insert({
            name: core.name,
            key: core.key,
            description: core.description,
            visibility_type: core.visibility_type,
            is_globally_enabled: core.is_globally_enabled,
            ...("required_subscription_tier" in core && core.required_subscription_tier != null && { required_subscription_tier: core.required_subscription_tier }),
          });
        if (insertErr) {
          if (insertErr.code !== "23505") {
            console.error("Core flag insert error:", insertErr);
          }
        } else {
          existingKeys.add(core.key);
        }
      }
    }

    if (existingKeys.size > (flags?.length ?? 0)) {
      const refetch = await (supabase as any).from("feature_flags").select("*").order("name");
      if (!refetch.error) flags = refetch.data;
    }

    const { data: assignments } = await (supabase as any)
      .from("feature_flag_assignments")
      .select("id, feature_flag_id, user_id, employer_id, enabled, expires_at");

    const assignmentsByFlag = (assignments || []).reduce((acc: Record<string, any[]>, a: any) => {
      if (!acc[a.feature_flag_id]) acc[a.feature_flag_id] = [];
      acc[a.feature_flag_id].push(a);
      return acc;
    }, {});

    const list = (flags || []).map((f: any) => ({
      ...f,
      assignments: assignmentsByFlag[f.id] || [],
      assignmentsCount: (assignmentsByFlag[f.id] || []).length,
    }));

    return NextResponse.json(list);
  } catch (err) {
    console.error("Admin feature flags GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag. SuperAdmin only.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as any).roles || [];
    if (!isSuperAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden: SuperAdmin only" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const key = typeof body.key === "string" ? body.key.trim().toLowerCase().replace(/\s+/g, "_") : "";
    const description = typeof body.description === "string" ? body.description : null;
    const visibility_type = ["ui", "api", "both"].includes(body.visibility_type) ? body.visibility_type : "both";
    const required_subscription_tier = typeof body.required_subscription_tier === "string" && body.required_subscription_tier.trim() ? body.required_subscription_tier.trim() : null;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const finalKey = key || name.toLowerCase().replace(/\s+/g, "_");

    const supabase = getSupabaseServer();
    const { data, error } = await (supabase as any)
      .from("feature_flags")
      .insert({
        name,
        key: finalKey,
        description,
        visibility_type,
        required_subscription_tier,
        is_globally_enabled: false,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Feature name or key already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await (getSupabaseServer() as any).from("admin_actions").insert({
        admin_id: session.user.id,
        impersonated_user_id: "",
        action_type: "feature_flag_updated",
        details: JSON.stringify({ flag_key: finalKey, action: "create" }),
      });
    } catch {
      // Logging must not crash the request
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin feature flags POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

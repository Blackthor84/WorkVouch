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

/**
 * GET /api/admin/feature-flags
 * List all feature flags (Admin + SuperAdmin). Includes key, required_subscription_tier, assignments count.
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
    const { data: flags, error } = await (supabase as any)
      .from("feature_flags")
      .select("*")
      .order("name");

    if (error) {
      console.error("Feature flags fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: assignments } = await (supabase as any)
      .from("feature_flag_assignments")
      .select("id, feature_flag_id, user_id, employer_id, enabled");

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

    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin feature flags POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

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
 * POST /api/admin/feature-flags/assignments
 * Create assignment. Admin can only when feature.is_globally_enabled = false; SuperAdmin always.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as any).roles || [];
    if (!isAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const feature_flag_id = body.feature_flag_id;
    const user_id = body.user_id ?? null;
    const employer_id = body.employer_id ?? null;
    const enabled = typeof body.enabled === "boolean" ? body.enabled : true;

    if (!feature_flag_id) {
      return NextResponse.json({ error: "feature_flag_id required" }, { status: 400 });
    }
    const hasUser = user_id != null && user_id !== "";
    const hasEmployer = employer_id != null && employer_id !== "";
    if ((hasUser && hasEmployer) || (!hasUser && !hasEmployer)) {
      return NextResponse.json(
        { error: "Provide exactly one of user_id or employer_id" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: flag, error: flagError } = await (supabase as any)
      .from("feature_flags")
      .select("is_globally_enabled")
      .eq("id", feature_flag_id)
      .single();

    if (flagError || !flag) {
      return NextResponse.json({ error: "Feature flag not found" }, { status: 404 });
    }
    if (!isSuperAdmin(roles) && flag.is_globally_enabled) {
      return NextResponse.json(
        { error: "Cannot assign when feature is globally enabled. Only SuperAdmin can change global state." },
        { status: 403 }
      );
    }

    const { data, error } = await (supabase as any)
      .from("feature_flag_assignments")
      .insert({
        feature_flag_id,
        user_id: hasUser ? user_id : null,
        employer_id: hasEmployer ? employer_id : null,
        enabled,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.message?.includes("unique")) {
        return NextResponse.json(
          { error: "Assignment already exists for this flag and target" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin feature flag assignment POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

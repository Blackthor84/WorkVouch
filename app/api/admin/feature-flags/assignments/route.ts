import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/feature-flags/assignments
 * Create assignment. Admin can only when feature.is_globally_enabled = false; SuperAdmin always.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      feature_flag_id,
      user_id,
      employer_id,
      enabled: enabledRaw,
      expires_at,
    } = await request.json();
    const enabled = typeof enabledRaw === "boolean" ? enabledRaw : true;

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
    if (!isSuperAdmin(role) && flag.is_globally_enabled) {
      return NextResponse.json(
        { error: "Cannot assign when feature is globally enabled. Only SuperAdmin can change global state." },
        { status: 403 }
      );
    }

    const insertRow: any = {
      feature_flag_id,
      user_id: user_id ?? null,
      employer_id: employer_id ?? null,
      enabled,
    };
    if (expires_at) {
      insertRow.expires_at = expires_at;
    }
    const { data, error } = await (supabase as any)
      .from("feature_flag_assignments")
      .insert(insertRow)
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

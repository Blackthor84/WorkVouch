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
 * PATCH /api/admin/feature-flags/assignments/[id]
 * Update assignment. Admin can only when feature.is_globally_enabled = false; SuperAdmin always.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as any).roles || [];
    if (!isAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const enabled = typeof body.enabled === "boolean" ? body.enabled : undefined;
    if (enabled === undefined) {
      return NextResponse.json({ error: "enabled required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: assignment } = await (supabase as any)
      .from("feature_flag_assignments")
      .select("id, feature_flag_id")
      .eq("id", id)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const { data: flag } = await (supabase as any)
      .from("feature_flags")
      .select("is_globally_enabled")
      .eq("id", assignment.feature_flag_id)
      .single();

    if (!isSuperAdmin(roles) && flag?.is_globally_enabled) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from("feature_flag_assignments")
      .update({ enabled })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin feature flag assignment PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/feature-flags/assignments/[id]
 * Admin can when !is_globally_enabled; SuperAdmin always.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as any).roles || [];
    if (!isAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseServer();

    const { data: assignment } = await (supabase as any)
      .from("feature_flag_assignments")
      .select("id, feature_flag_id")
      .eq("id", id)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const { data: flag } = await (supabase as any)
      .from("feature_flags")
      .select("is_globally_enabled")
      .eq("id", assignment.feature_flag_id)
      .single();

    if (!isSuperAdmin(roles) && flag?.is_globally_enabled) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await (supabase as any).from("feature_flag_assignments").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin feature flag assignment DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

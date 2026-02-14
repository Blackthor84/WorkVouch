import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/roles";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
/**
 * PATCH /api/admin/feature-flags/[id]
 * Update feature flag. SuperAdmin only (is_globally_enabled, visibility_type, required_subscription_tier, description, name).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (role !== "superadmin") return NextResponse.json({ error: "Forbidden: SuperAdmin only" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.is_globally_enabled === "boolean") updates.is_globally_enabled = body.is_globally_enabled;
    if (["ui", "api", "both"].includes(body.visibility_type)) updates.visibility_type = body.visibility_type;
    if (typeof body.required_subscription_tier === "string") updates.required_subscription_tier = body.required_subscription_tier.trim() || null;
    if (typeof body.description === "string") updates.description = body.description;
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.key === "string" && body.key.trim()) updates.key = body.key.trim().toLowerCase().replace(/\s+/g, "_");

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await (supabase as any)
      .from("feature_flags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      const flagKey = (data as { key?: string }).key ?? "";
      await (getSupabaseServer() as any).from("admin_actions").insert({
        admin_id: user.id,
        impersonated_user_id: "",
        action_type: "feature_flag_updated",
        details: JSON.stringify({ flag_key: flagKey, action: "update" }),
      });
    } catch {
      // Logging must not crash the request
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin feature flag PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/feature-flags/[id]
 * Delete feature flag. SuperAdmin only.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isSuperAdmin(role)) return NextResponse.json({ error: "Forbidden: SuperAdmin only" }, { status: 403 });

    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data: flag } = await (supabase as any).from("feature_flags").select("key").eq("id", id).single();
    const flagKey = (flag as { key?: string } | null)?.key ?? "";
    const { error } = await (supabase as any).from("feature_flags").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      await (supabase as any).from("admin_actions").insert({
        admin_id: user.id,
        impersonated_user_id: "",
        action_type: "feature_flag_updated",
        details: JSON.stringify({ flag_key: flagKey, action: "delete" }),
      });
    } catch {
      // Logging must not crash the request
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin feature flag DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

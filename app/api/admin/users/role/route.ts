import { NextResponse } from "next/server";
import { requireAdminThrow } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = ["user", "employer", "admin", "superadmin"] as const;

/** POST /api/admin/users/role — override user role. Server-enforced. Profiles use id = auth user id. */
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdminThrow();
    const body = await req.json().catch(() => ({}));
    const { user_id, role } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabaseAny = supabase as any;
    const { error } = await supabaseAny
      .from("profiles")
      .update({ role })
      .eq("id", user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

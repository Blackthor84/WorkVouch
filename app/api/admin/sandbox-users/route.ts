import { NextResponse } from "next/server";
import { requireAdminThrow } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/sandbox-users — create a sandbox user (admin/superadmin). Server-enforced. */
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdminThrow();
    const body = await req.json().catch(() => ({}));
    const { display_name } = body;

    if (!display_name || typeof display_name !== "string" || !display_name.trim()) {
      return NextResponse.json({ error: "Missing or invalid display_name" }, { status: 400 });
    }

    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from("sandbox_users")
      .insert({ display_name: display_name.trim() })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

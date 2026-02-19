import { NextResponse } from "next/server";
import { requireAdminThrow } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/reputation/recalc — force reputation recalc for a user. Server-enforced. */
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdminThrow();
    const body = await req.json().catch(() => ({}));
    const user_id = body?.user_id;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabaseAny = supabase as any;
    const { error } = await supabaseAny.rpc("recalculate_reputation", {
      target_user_id: user_id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

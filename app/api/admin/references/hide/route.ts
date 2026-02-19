import { NextResponse } from "next/server";
import { requireAdminThrow } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/references/hide — soft-hide a reference (moderation). Server-enforced. */
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdminThrow();
    const body = await req.json().catch(() => ({}));
    const reference_id = body?.reference_id;

    if (!reference_id) {
      return NextResponse.json({ error: "Missing reference_id" }, { status: 400 });
    }

    const supabaseAny = supabase as any;
    await supabaseAny
      .from("user_references")
      .update({ is_hidden: true })
      .eq("id", reference_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

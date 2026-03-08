import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { requireAdminThrow } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/references — list all references (admin/superadmin). Server-enforced. */
export async function GET() {
  try {
    const { supabase } = await requireAdminThrow();

    const { data } = await admin.from("user_references")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ references: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

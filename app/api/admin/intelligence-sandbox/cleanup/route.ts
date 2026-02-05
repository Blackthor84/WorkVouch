/**
 * POST /api/admin/intelligence-sandbox/cleanup
 * Marks expired sandboxes as deleted. Never returns 400; always structured JSON.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("Sandbox CLEANUP hit");

    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from("intelligence_sandboxes")
      .update({ status: "deleted" })
      .lt("ends_at", new Date().toISOString());

    if (error) {
      console.error("Sandbox cleanup error:", error);
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sandbox CLEANUP fatal error:", err);
    return NextResponse.json({ success: false });
  }
}

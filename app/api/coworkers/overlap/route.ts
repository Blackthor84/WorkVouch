import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.user.id;

    // Raw SQL for accurate overlap detection
    const { data, error } = await supabase.rpc("get_coworker_overlaps", {
      requester_id: userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coworkers: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch coworkers" },
      { status: 500 }
    );
  }
}

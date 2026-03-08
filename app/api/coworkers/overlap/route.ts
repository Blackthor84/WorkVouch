import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_coworker_overlaps", {
      requester_id: user.id,
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

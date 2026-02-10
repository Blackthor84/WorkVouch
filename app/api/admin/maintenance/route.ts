import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET: public endpoint to check maintenance mode (no auth). Used by middleware or signup/review flows. */
export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase.from("system_settings").select("value").eq("key", "maintenance_mode").maybeSingle();
    const value = (data as { value?: { enabled?: boolean; block_signups?: boolean; block_reviews?: boolean; block_employment?: boolean; banner_message?: string } } | null)?.value;
    const enabled = value?.enabled === true;
    return NextResponse.json({
      enabled,
      block_signups: value?.block_signups ?? true,
      block_reviews: value?.block_reviews ?? true,
      block_employment: value?.block_employment ?? true,
      banner_message: value?.banner_message ?? null,
    });
  } catch {
    return NextResponse.json({ enabled: false, block_signups: false, block_reviews: false, block_employment: false, banner_message: null });
  }
}

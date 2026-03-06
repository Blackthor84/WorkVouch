/**
 * GET /api/trust/coworkers/[employmentRecordId]
 * Returns discovered coworkers (same company, overlapping dates) for the given employment record.
 * Record must belong to the current user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { discoverCoworkers } from "@/lib/trust/discoverCoworkers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ employmentRecordId: string }> }
) {
  const { employmentRecordId } = await context.params;
  if (!employmentRecordId) {
    return NextResponse.json({ error: "employmentRecordId required" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const profileId = (profileRow as { id: string } | null)?.id ?? effective.id;

  const { data: record } = await supabase
    .from("employment_records")
    .select("id")
    .eq("id", employmentRecordId)
    .eq("user_id", profileId)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ error: "Employment record not found or not yours" }, { status: 404 });
  }

  const coworkers = await discoverCoworkers(supabase, employmentRecordId, profileId);

  return NextResponse.json({
    coworkers: coworkers.map((c) => ({
      profileId: c.profileId,
      name: c.name,
      jobTitle: c.jobTitle,
      companyName: c.companyName,
      overlapStart: c.overlapStart,
      overlapEnd: c.overlapEnd,
    })),
  });
}

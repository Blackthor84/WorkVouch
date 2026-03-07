/**
 * GET /api/trust/timeline
 * Returns chronological trust events for the current user (verifications, references, disputes, credential shares).
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TrustEventImpact } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustTimelineEvent = {
  id: string;
  event_type: string;
  impact: TrustEventImpact | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TrustTimelineResponse = {
  events: TrustTimelineEvent[];
};

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: rows, error } = await supabase
    .from("trust_events")
    .select("id, event_type, impact, metadata, created_at")
    .eq("profile_id", effective.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events: TrustTimelineEvent[] = (rows ?? []).map((r: any) => ({
    id: (r as { id: string }).id,
    event_type: (r as { event_type: string }).event_type,
    impact: (r as { impact: TrustEventImpact | null }).impact ?? null,
    metadata: (r as { metadata: Record<string, unknown> | null }).metadata ?? null,
    created_at: (r as { created_at: string }).created_at,
  }));

  return NextResponse.json({ events } satisfies TrustTimelineResponse);
}

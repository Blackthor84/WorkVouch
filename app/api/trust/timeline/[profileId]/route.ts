// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/trust/timeline/[profileId]
 * Returns chronological trust_events for a profile (candidate). Used by Trust Timeline visualization.
 * Auth: employer or admin. Pagination: limit 50, offset via query.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 50;

export type TrustTimelineEventItem = {
  id: string;
  event_type: string;
  created_at: string;
  payload: Record<string, unknown> | null;
};

export type TrustTimelineProfileResponse = {
  events: TrustTimelineEventItem[];
  hasMore: boolean;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin =
    effective.role === "admin" ||
    effective.role === "superadmin" ||
    effective.role === "super_admin";
  const isEmployer = effective.role === "employer";
  const isOwner = effective.id === (await params).profileId;
  if (!isAdmin && !isEmployer && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { profileId } = await params;
  if (!profileId?.trim()) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const url = new URL(req.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const { data: rows, error } = await admin
    .from("trust_events")
    .select("id, event_type, created_at, payload")
    .eq("profile_id", profileId.trim())
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as unknown as { id: string; event_type: string; created_at: string; payload: unknown }[];
  const events: TrustTimelineEventItem[] = list.map((r) => ({
    id: r.id,
    event_type: r.event_type,
    created_at: r.created_at,
    payload: (r.payload as Record<string, unknown>) ?? null,
  }));

  const hasMore = list.length === limit;

  return NextResponse.json({
    events,
    hasMore,
  } satisfies TrustTimelineProfileResponse);
}

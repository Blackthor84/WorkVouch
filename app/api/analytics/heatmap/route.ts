/**
 * GET /api/analytics/heatmap
 *
 * Privacy-safe adoption heat map: aggregated counts by country (always) and optional U.S. state.
 * - Never returns per-user rows, city, ZIP, coordinates, or real-time data.
 * - Minimum count threshold: below threshold show "Low activity" or omit.
 * - Public: country-level only. Authenticated: may request state-level for US.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { logAudit } from "@/lib/soc2-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_COUNT_THRESHOLD = 5;
const PRIVACY_MESSAGE = "Locations are approximate and shown in aggregate to protect user privacy.";

type HeatmapRow = { country: string; state?: string | null; count: number };

/** Reject and log if any row contains disallowed location fields (privacy guard). */
function guardNoIdentifiableLocation(rows: HeatmapRow[]): void {
  const disallowed = ["city", "zip", "postal", "latitude", "longitude", "coordinates", "address"];
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    for (const key of disallowed) {
      if (r[key] !== undefined && r[key] !== null) {
        console.error("[API ERROR] Heatmap response contained disallowed location field", { key, route: "/api/analytics/heatmap" });
        throw new Error("PRIVACY_VIOLATION: identifiable location in heatmap");
      }
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeState = searchParams.get("state") === "true" || searchParams.get("state") === "1";

    let actorId: string | null = null;
    if (includeState) {
      const supabaseAuth = await supabaseServer();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user?.id) {
        console.warn("[AUTH]", { route: "/api/analytics/heatmap", reason: "state=true requires authenticated user" });
        return NextResponse.json({ error: "Unauthorized", data: [], message: PRIVACY_MESSAGE }, { status: 401 });
      }
      actorId = user.id;
    }

    await logAudit({
      actorId: actorId ?? undefined,
      action: "VIEW_HEATMAP",
      resource: "analytics/heatmap",
    });

    const supabase = getSupabaseServer();

    const { data: locationRows, error } = await supabase
      .from("user_locations")
      .select("country, state");

    if (error) {
      console.error("[HEATMAP ERROR]", error);
      return NextResponse.json({ data: [], message: PRIVACY_MESSAGE }, { status: 200 });
    }

    const bucket: Record<string, number> = {};
    for (const r of locationRows ?? []) {
      const row = r as { country: string; state: string | null };
      const country = (row.country ?? "unknown").trim() || "unknown";
      const state = row.state?.trim() ?? null;
      const key = includeState && state ? `${country}|${state}` : country;
      bucket[key] = (bucket[key] ?? 0) + 1;
    }

    const data: HeatmapRow[] = [];
    for (const [key, count] of Object.entries(bucket)) {
      if (count < MIN_COUNT_THRESHOLD) continue;
      const [country, state] = key.includes("|") ? key.split("|") : [key, undefined];
      data.push({ country, state: state ?? undefined, count });
    }
    data.sort((a, b) => b.count - a.count);

    guardNoIdentifiableLocation(data);
    return NextResponse.json({
      data,
      threshold: MIN_COUNT_THRESHOLD,
      message: PRIVACY_MESSAGE,
    });
  } catch (err) {
    console.error("[API ERROR]", err);
    if (err instanceof Error && err.message === "PRIVACY_VIOLATION: identifiable location in heatmap") {
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
    return NextResponse.json({ data: [], message: PRIVACY_MESSAGE }, { status: 200 });
  }
}

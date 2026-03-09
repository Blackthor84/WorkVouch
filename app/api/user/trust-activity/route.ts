// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/user/trust-activity — Trust Activity timeline for the current user.
 * Returns real events only: employment verification, reference added, dispute resolved,
 * trust score change, credential created/expired. No synthetic or placeholder events.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustActivityEventType =
  | "employment_verification"
  | "reference_added"
  | "dispute_resolved"
  | "dispute_opened"
  | "trust_score_change"
  | "credential_created"
  | "credential_expired"
  | "credential_revoked";

export type TrustActivityEntry = {
  type: TrustActivityEventType;
  event: string;
  impact: number | null;
  date: string;
  metadata?: Record<string, unknown>;
};

function toEntry(
  type: TrustActivityEventType,
  event: string,
  date: string,
  impact: number | null = null,
  metadata?: Record<string, unknown>
): TrustActivityEntry {
  return { type, event, impact, date, metadata };
}

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = effective.id;
  const now = new Date().toISOString();
  const entries: TrustActivityEntry[] = [];

  // 1. Employment verification (employment_records where verification_status = verified)
  const { data: employmentRows } = await admin.from("employment_records")
    .select("id, company_name, title, updated_at, verification_status")
    .eq("user_id", userId)
    .eq("verification_status", "verified")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (employmentRows?.length) {
    for (const row of employmentRows as { id: string; company_name?: string; job_title?: string; updated_at: string }[]) {
      entries.push(
        toEntry(
          "employment_verification",
          `Employment verified${row.company_name ? ` at ${row.company_name}` : ""}`,
          row.updated_at,
          null,
          { company_name: row.company_name, job_title: row.title }
        )
      );
    }
  }

  // 2. Reference added (user_references for this user)
  const { data: refRows } = await admin.from("user_references")
    .select("id, created_at, rating")
    .eq("to_user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (refRows?.length) {
    for (const row of refRows as { id: string; created_at: string; rating?: number }[]) {
      entries.push(
        toEntry("reference_added", "Reference added", row.created_at, null, { rating: row.rating })
      );
    }
  }

  // 3. Disputes (opened and resolved)
  const { data: disputeRows } = await admin.from("disputes")
    .select("id, status, created_at, updated_at, dispute_type")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (disputeRows?.length) {
    for (const row of disputeRows as { id: string; status: string; created_at: string; updated_at: string; dispute_type?: string }[]) {
      if (row.status === "resolved") {
        entries.push(
          toEntry("dispute_resolved", "Dispute resolved", row.updated_at, null, { dispute_type: row.dispute_type })
        );
      }
      entries.push(
        toEntry("dispute_opened", "Dispute opened", row.created_at, null, { dispute_type: row.dispute_type })
      );
    }
  }

  // 4. Trust score change (intelligence_score_history)
  const { data: historyRows } = await admin.from("intelligence_score_history")
    .select("reason, delta, created_at")
    .eq("user_id", userId)
    .eq("entity_type", "trust_score")
    .order("created_at", { ascending: false })
    .limit(20);

  if (historyRows?.length) {
    for (const row of historyRows as { reason: string | null; delta: number | null; created_at: string }[]) {
      const eventLabel = row.reason ? row.reason.replace(/_/g, " ") : "Trust score updated";
      entries.push(
        toEntry("trust_score_change", eventLabel, row.created_at, row.delta ?? null, { reason: row.reason })
      );
    }
  }

  // 5. Credentials: created, expired, revoked
  const { data: credRows } = await admin.from("workvouch_credentials")
    .select("id, issued_at, expires_at, revoked_at")
    .eq("candidate_id", userId)
    .order("issued_at", { ascending: false })
    .limit(30);

  if (credRows?.length) {
    for (const row of credRows as { id: string; issued_at: string; expires_at: string | null; revoked_at: string | null }[]) {
      entries.push(toEntry("credential_created", "Credential issued", row.issued_at, null));
      if (row.revoked_at) {
        entries.push(toEntry("credential_revoked", "Credential revoked", row.revoked_at, null));
      }
      if (row.expires_at && row.expires_at < now && !row.revoked_at) {
        entries.push(toEntry("credential_expired", "Credential expired", row.expires_at, null));
      }
    }
  }

  // Sort by date descending; dedupe by (type, date, event) to avoid duplicate entries
  const seen = new Set<string>();
  const deduped = entries.filter((e) => {
    const key = `${e.type}:${e.date}:${e.event}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

  return NextResponse.json({ events: deduped });
}

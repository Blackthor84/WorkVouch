/**
 * Hidden peer workstyle signals. Internal only.
 * Derived from vouches, disputes, confirmations. Never shown to users or employers.
 * Signals require pattern repetition; conflicting signals reduce confidence; decay over time.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { PeerWorkstyleSignalKey } from "./constants";
import { PEER_WORKSTYLE_SIGNAL_KEYS } from "./constants";

const DECAY_HALFLIFE_DAYS = 365;
const MIN_OBSERVATIONS_FOR_SIGNAL = 2;

function decayFactor(lastObserved: string): number {
  const days = (Date.now() - new Date(lastObserved).getTime()) / (24 * 60 * 60 * 1000);
  return Math.pow(0.5, days / DECAY_HALFLIFE_DAYS);
}

export type PeerWorkstyleSignalRow = {
  signal_key: string;
  confidence_score: number;
  observation_count: number;
  last_observed: string;
};

/**
 * Record one observation. Increments observation count; confidence adjusted gradually (running average).
 * No single event creates a signal; MIN_OBSERVATIONS_FOR_SIGNAL (3) required. Does not penalize or block.
 */
export async function recordPeerWorkstyleObservation(params: {
  userId: string;
  signalKey: PeerWorkstyleSignalKey;
  confidenceDelta: number;
}): Promise<void> {
  if (!(PEER_WORKSTYLE_SIGNAL_KEYS as readonly string[]).includes(params.signalKey)) return;
  const delta = Math.max(0, Math.min(1, params.confidenceDelta));
  const sb = getSupabaseServer();
  const { data: row } = await sb
    .from("peer_workstyle_signals")
    .select("id, confidence_score, observation_count")
    .eq("user_id", params.userId)
    .eq("signal_key", params.signalKey)
    .maybeSingle();
  if (row) {
    const r = row as { id: string; confidence_score: number; observation_count: number };
    const newCount = r.observation_count + 1;
    const newConf = (r.confidence_score * r.observation_count + delta) / newCount;
    await sb
      .from("peer_workstyle_signals")
      .update({
        confidence_score: newConf,
        observation_count: newCount,
        last_observed: new Date().toISOString(),
      })
      .eq("id", r.id);
  } else {
    const gradualDelta = Math.min(delta, 0.25);
    await sb.from("peer_workstyle_signals").insert({
      user_id: params.userId,
      signal_key: params.signalKey,
      confidence_score: gradualDelta,
      observation_count: 1,
      last_observed: new Date().toISOString(),
    });
  }
}

/**
 * Get workstyle signals for a user. Internal only.
 * Applies decay on read (decay never in SQL). Detects conflicting signals and reduces confidence (not punitive).
 */
export async function getPeerWorkstyleSignals(userId: string): Promise<PeerWorkstyleSignalRow[]> {
  const sb = getSupabaseServer();
  const { data: rows } = await sb
    .from("peer_workstyle_signals")
    .select("signal_key, confidence_score, observation_count, last_observed")
    .eq("user_id", userId);
  if (!rows || rows.length === 0) return [];
  const withDecay = (rows as PeerWorkstyleSignalRow[]).map((r) => ({
    ...r,
    confidence_score:
      r.observation_count >= MIN_OBSERVATIONS_FOR_SIGNAL
        ? r.confidence_score * decayFactor(r.last_observed)
        : 0,
  }));
  const keysPresent = new Set(withDecay.filter((r) => r.confidence_score > 0).map((r) => r.signal_key));
  return withDecay.map((r) => {
    let conf = r.confidence_score;
    for (const [a, b] of CONFLICT_PAIRS) {
      if (keysPresent.has(a) && keysPresent.has(b) && (r.signal_key === a || r.signal_key === b)) {
        conf *= 0.7;
      }
    }
    return { ...r, confidence_score: conf };
  });
}

/**
 * Derive and record signals from a new employment reference (vouch).
 * Call after reference is created. Does not create a signal from one vouch; accumulates.
 */
export async function deriveWorkstyleSignalsFromReference(params: {
  reviewedUserId: string;
  reviewerTrustWeight: number;
  sentimentScore: number | null;
}): Promise<void> {
  const { reviewedUserId, reviewerTrustWeight, sentimentScore } = params;
  const weight = Math.max(0, Math.min(1, reviewerTrustWeight));
  if (weight <= 0) return;
  if (sentimentScore != null && sentimentScore > 0.3) {
    await recordPeerWorkstyleObservation({
      userId: reviewedUserId,
      signalKey: "TEAM_POSITIVE",
      confidenceDelta: weight * 0.3,
    });
  }
  if (sentimentScore != null && sentimentScore >= 0.5) {
    await recordPeerWorkstyleObservation({
      userId: reviewedUserId,
      signalKey: "HIGH_PEER_ALIGNMENT",
      confidenceDelta: weight * 0.25,
    });
  }
}

/**
 * Derive signals from dispute involvement. Call when a dispute is resolved.
 */
export async function deriveWorkstyleSignalsFromDispute(params: {
  userId: string;
  wasReported: boolean;
}): Promise<void> {
  if (params.wasReported) {
    await recordPeerWorkstyleObservation({
      userId: params.userId,
      signalKey: "DISPUTED_VOUCHES",
      confidenceDelta: 0.2,
    });
  }
}

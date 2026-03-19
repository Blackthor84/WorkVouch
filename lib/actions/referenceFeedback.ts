"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReferenceRequestStatus = "pending" | "accepted" | "rejected";

/**
 * Request a reference from a coworker (by match). Inserts reference_requests with status "pending".
 */
export async function requestReference(
  matchId: string,
  receiverId: string,
  message?: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const sb = supabase as any;
  const { error } = await sb.from("reference_requests").insert({
    requester_id: user.id,
    receiver_id: receiverId,
    coworker_match_id: matchId,
    status: "pending",
    message: (message ?? "").trim() || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/coworker-matches");
  revalidatePath("/requests");
  return {};
}

/**
 * Accept or reject a reference request (receiver only).
 */
export async function respondToRequest(
  requestId: string,
  status: "accepted" | "rejected"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const sb = supabase as any;
  const { data: row, error: fetchErr } = await sb
    .from("reference_requests")
    .select("id, receiver_id")
    .eq("id", requestId)
    .single();

  if (fetchErr || !row || row.receiver_id !== user.id)
    return { error: "Request not found or you are not the receiver" };

  const { error } = await sb
    .from("reference_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/requests");
  revalidatePath("/coworker-matches");
  return {};
}

/**
 * Submit reference feedback after accepting a request. Creates reference_feedback and updates trust score (trigger).
 */
export async function submitReference(
  requestId: string,
  rating: number,
  feedback?: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5" };

  const sb = supabase as any;
  const { data: req, error: fetchErr } = await sb
    .from("reference_requests")
    .select("id, requester_id, receiver_id, status")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req)
    return { error: "Request not found" };
  if (req.status !== "accepted")
    return { error: "Request must be accepted before leaving a reference" };
  if (req.receiver_id !== user.id)
    return { error: "Only the receiver can leave this reference" };

  const { error: insertErr } = await sb.from("reference_feedback").insert({
    request_id: requestId,
    author_id: user.id,
    target_user_id: req.requester_id,
    rating: Math.round(rating),
    feedback: (feedback ?? "").trim() || null,
  });

  if (insertErr) return { error: insertErr.message };
  revalidatePath("/profile");
  revalidatePath("/requests");
  revalidatePath("/coworker-matches");
  return {};
}

export type UserReferenceItem = {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  author_name: string | null;
  company_name: string | null;
};

/**
 * Get all references for a user's profile (reference_feedback where target_user_id = userId).
 */
export async function getUserReferences(userId: string): Promise<UserReferenceItem[]> {
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: rows, error } = await sb
    .from("reference_feedback")
    .select(`
      id,
      rating,
      feedback,
      created_at,
      author_id,
      request_id
    `)
    .eq("target_user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const requestIds = [...new Set(rows.map((r: { request_id: string }) => r.request_id))];
  const { data: requests } = await sb
    .from("reference_requests")
    .select("id, coworker_match_id")
    .in("id", requestIds);

  const matchIds = [...new Set((requests ?? []).map((r: { coworker_match_id: string }) => r.coworker_match_id))];
  const matchIdToRequestId: Record<string, string> = {};
  (requests ?? []).forEach((r: { id: string; coworker_match_id: string }) => {
    matchIdToRequestId[r.id] = r.coworker_match_id;
  });

  let companyByRequestId: Record<string, string | null> = {};
  if (matchIds.length > 0) {
    const { data: matches } = await sb
      .from("coworker_matches")
      .select("id, company_name")
      .in("id", matchIds);
    const companyByMatchId: Record<string, string | null> = {};
    (matches ?? []).forEach((m: { id: string; company_name: string | null }) => {
      companyByMatchId[m.id] = m.company_name ?? null;
    });
    Object.entries(matchIdToRequestId).forEach(([reqId, matchId]) => {
      companyByRequestId[reqId] = companyByMatchId[matchId] ?? null;
    });
  }

  const authorIds = [...new Set(rows.map((r: { author_id: string }) => r.author_id))];
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name")
    .in("id", authorIds);
  const nameByAuthor: Record<string, string | null> = {};
  (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => {
    nameByAuthor[p.id] = p.full_name ?? null;
  });

  return rows.map((r: { id: string; rating: number; feedback: string | null; created_at: string; author_id: string; request_id: string }) => ({
    id: r.id,
    rating: r.rating,
    feedback: r.feedback,
    created_at: r.created_at,
    author_name: nameByAuthor[r.author_id] ?? null,
    company_name: companyByRequestId[r.request_id] ?? null,
  }));
}

export type TrustForProfile = { score: number; totalReferences: number };

/**
 * Get trust score and total reference count for a user (profile display).
 */
export async function getTrustForProfile(userId: string): Promise<TrustForProfile> {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data } = await sb
    .from("trust_scores")
    .select("score, reference_count")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    score: Number(data?.score ?? 0),
    totalReferences: Number(data?.reference_count ?? 0),
  };
}

/**
 * GET /api/e2e/employer-view-of?profileId=<uuid>
 * Only when E2E_TEST_SECRET is set. Requires auth (employer). Returns getCandidateProfileForEmployer(profileId).
 * Used by E2E to capture exact payload employer sees when viewing that candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const E2E_SECRET = process.env.E2E_TEST_SECRET;

export async function GET(req: NextRequest) {
  if (!E2E_SECRET || E2E_SECRET.length < 16) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getEffectiveUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await admin.from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? null;
  if (role !== "employer") {
    return NextResponse.json({ error: "Employer role required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId")?.trim();
  if (!profileId || !/^[0-9a-f-]{36}$/i.test(profileId)) {
    return NextResponse.json({ error: "Missing or invalid profileId" }, { status: 400 });
  }

  try {
    const payload = await getCandidateProfileForEmployer(profileId);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

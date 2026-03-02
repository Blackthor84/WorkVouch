/**
 * GET /api/e2e/profile-payload?profileId=<uuid>
 * Only when E2E_TEST_SECRET is set. Returns getCandidateProfileData(profileId) for assertion.
 * No auth required when secret is present — used only in E2E to compare employee vs employer payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCandidateProfileData } from "@/lib/actions/employer/candidate-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const E2E_SECRET = process.env.E2E_TEST_SECRET;

export async function GET(req: NextRequest) {
  if (!E2E_SECRET || E2E_SECRET.length < 16) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId")?.trim();
  if (!profileId || !/^[0-9a-f-]{36}$/i.test(profileId)) {
    return NextResponse.json({ error: "Missing or invalid profileId" }, { status: 400 });
  }

  try {
    const payload = await getCandidateProfileData(profileId);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

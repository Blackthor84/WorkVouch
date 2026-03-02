/**
 * GET /api/e2e/my-employer-view
 * Only when E2E_TEST_SECRET is set. Requires auth (employee). Returns getMyProfileAsEmployerSeesIt().
 * Used by E2E to capture exact payload shown on "View My Profile as an Employer".
 */

import { NextResponse } from "next/server";
import { getMyProfileAsEmployerSeesIt } from "@/lib/actions/employer/candidate-search";
import { getEffectiveUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const E2E_SECRET = process.env.E2E_TEST_SECRET;

export async function GET() {
  if (!E2E_SECRET || E2E_SECRET.length < 16) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getEffectiveUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await getMyProfileAsEmployerSeesIt();
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

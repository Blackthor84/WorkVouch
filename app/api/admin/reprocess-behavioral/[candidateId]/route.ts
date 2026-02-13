/**
 * POST /api/admin/reprocess-behavioral/[candidateId]
 * Admin/superadmin only. Rebuilds full behavioral_profile_vector from review_intelligence rows.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { updateBehavioralVector } from "@/lib/intelligence/updateBehavioralVector";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden: admin or superadmin only" }, { status: 403 });
    }

    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });
    }

    await updateBehavioralVector(candidateId);
    return NextResponse.json({ ok: true, candidateId });
  } catch (e) {
    console.error("[admin reprocess-behavioral]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

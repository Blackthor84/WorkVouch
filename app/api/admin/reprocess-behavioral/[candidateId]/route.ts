/**
 * POST /api/admin/reprocess-behavioral/[candidateId]
 * Admin/superadmin only. Rebuilds full behavioral_profile_vector from review_intelligence rows.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { updateBehavioralVector } from "@/lib/intelligence/updateBehavioralVector";

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as { roles?: string[] }).roles ?? [];
    if (!isAdmin(roles)) {
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

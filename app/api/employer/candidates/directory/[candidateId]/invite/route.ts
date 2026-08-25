// IMPORTANT: All server routes use `admin` from @/lib/supabase-admin.

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { sendEmployerCandidateInvite } from "@/lib/employer/candidates/candidate-invite-service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ candidateId: string }> };

async function resolveEmployerContext(userId: string, role: string) {
  const sb = admin as any;
  const { data: acct } = await sb
    .from("employer_accounts")
    .select("id, company_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (!acct?.id) {
    return null;
  }

  return {
    employerAccountId: String(acct.id),
    companyName: String(acct.company_name ?? "Your employer"),
    role,
  };
}

export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getCurrentUserProfile();
    const role = profile?.role ?? "";
    if (role !== "employer" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employerCtx = await resolveEmployerContext(user.id, role);
    if (!employerCtx) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    const { candidateId } = await context.params;
    const result = await sendEmployerCandidateInvite({
      employerAccountId: employerCtx.employerAccountId,
      employerUserId: user.id,
      companyName: employerCtx.companyName,
      directoryCandidateId: candidateId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      invitationId: result.invitationId,
      invitationStatus: result.invitationStatus,
      platformStatus: result.platformStatus,
      alreadySent: result.alreadySent,
      directoryId: result.directoryId,
    });
  } catch (e) {
    console.error("[employer/candidates/directory/invite]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

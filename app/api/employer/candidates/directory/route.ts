// IMPORTANT: All server routes use `admin` from @/lib/supabase-admin.

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import {
  fetchEmployerCandidateDirectory,
  parseDirectoryQueryParams,
  resolveDirectoryPlanTier,
} from "@/lib/employer/candidates/directory-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

    const sb = admin as any;
    const { data: acct } = await sb
      .from("employer_accounts")
      .select("id, plan_tier")
      .eq("user_id", user.id)
      .maybeSingle();

    const employerAccountId = (acct as { id?: string } | null)?.id;
    if (!employerAccountId) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    const planTier = resolveDirectoryPlanTier(role, (acct as { plan_tier?: string } | null)?.plan_tier);
    const { source, connectionId, q, page, limit } = parseDirectoryQueryParams(req.nextUrl);

    const result = await fetchEmployerCandidateDirectory({
      employerAccountId,
      employerUserId: user.id,
      planTier,
      source,
      connectionId,
      q,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("[employer/candidates/directory]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

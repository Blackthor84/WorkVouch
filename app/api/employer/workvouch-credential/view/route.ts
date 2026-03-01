/**
 * GET /api/employer/workvouch-credential/view — Read-only credential view for employer.
 * Query: token=<share_token> OR applicationId=<job_application_id>
 * Employers may NOT edit credentials. Audit view in credential_views_audit.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[AUTH]", { route: "/api/employer/workvouch-credential/view", reason: "unauthenticated" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const applicationId = searchParams.get("applicationId");

    if (!token && !applicationId) {
      return NextResponse.json({ error: "Provide token or applicationId" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const admin = getSupabaseServer();

    let credentialId: string | null = null;
    let context: "link" | "job_application" = "link";
    let jobApplicationId: string | null = null;
    let employerAccountId: string | null = null;

    if (applicationId) {
      const { data: app } = await admin
        .from("job_applications")
        .select("id, workvouch_credential_id, job_postings(employer_id)")
        .eq("id", applicationId)
        .single();
      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
      const job = app as { job_postings?: { employer_id: string } | null };
      const employerId = job.job_postings?.employer_id;
      if (!employerId || employerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      credentialId = (app as { workvouch_credential_id: string | null }).workvouch_credential_id ?? null;
      context = "job_application";
      jobApplicationId = (app as { id: string }).id;
      const { data: ea } = await admin.from("employer_accounts").select("id").eq("user_id", user.id).maybeSingle();
      employerAccountId = (ea as { id: string } | null)?.id ?? null;
    } else if (token) {
      const { data: cred } = await admin
        .from("workvouch_credentials")
        .select("id")
        .eq("share_token", token)
        .is("revoked_at", null)
        .single();
      if (!cred) return NextResponse.json({ error: "Credential not found or revoked" }, { status: 404 });
      credentialId = (cred as { id: string }).id;
      const { data: ea } = await admin.from("employer_accounts").select("id").eq("user_id", user.id).maybeSingle();
      employerAccountId = (ea as { id: string } | null)?.id ?? null;
    }

    if (!credentialId) {
      return NextResponse.json({ error: "No credential linked to this application" }, { status: 404 });
    }

    const { data: cred, error } = await admin
      .from("workvouch_credentials")
      .select("id, payload, visibility, issued_at, expires_at")
      .eq("id", credentialId)
      .single();

    if (error || !cred) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const c = cred as { expires_at: string | null };
    const expired = c.expires_at && new Date(c.expires_at) < new Date();
    if (expired) {
      return NextResponse.json({ error: "Credential expired" }, { status: 410 });
    }

    await admin.from("credential_views_audit").insert({
      workvouch_credential_id: credentialId,
      viewer_id: user.id,
      viewer_employer_id: employerAccountId,
      context,
      job_application_id: jobApplicationId,
    });

    const out = cred as { id: string; payload: unknown; visibility: string; issued_at: string; expires_at: string | null };
    return NextResponse.json({
      credential: {
        id: out.id,
        payload: out.payload,
        visibility: out.visibility,
        issued_at: out.issued_at,
        expires_at: out.expires_at,
      },
      readOnly: true,
    });
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

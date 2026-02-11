import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { updateCredentialStatus } from "@/lib/credentials/statusUpdater";
import { generateComplianceAlerts } from "@/lib/compliance/generateAlerts";

/**
 * PATCH /api/employer/credentials/[id] — update professional credential
 * Body: credential_name?, issuing_authority?, credential_number?, issue_date?, expiration_date?, document_url?, status?
 * Calls updateCredentialStatus and generateComplianceAlerts for employer.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: credentialId } = await params;
    const sb = getSupabaseServer() as any;
    const { data: ea } = await sb.from("employer_accounts").select("id").eq("user_id", user.id);
    const account = Array.isArray(ea) ? ea[0] : ea;
    if (!account?.id) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;

    const { data: existing, error: fetchError } = await sb
      .from("professional_credentials")
      .select("id, employer_id")
      .eq("id", credentialId)
      .single();

    if (fetchError || !existing) return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    if ((existing as { employer_id: string }).employer_id !== employerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.credential_name != null) updates.credential_name = body.credential_name;
    if (body.issuing_authority != null) updates.issuing_authority = body.issuing_authority;
    if (body.credential_number != null) updates.credential_number = body.credential_number;
    if (body.issue_date != null) updates.issue_date = body.issue_date;
    if (body.expiration_date != null) updates.expiration_date = body.expiration_date;
    if (body.document_url != null) updates.document_url = body.document_url;
    if (body.status != null && ["active", "expired", "suspended"].includes(body.status)) updates.status = body.status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { error: updateError } = await sb
      .from("professional_credentials")
      .update(updates)
      .eq("id", credentialId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    try {
      await updateCredentialStatus(credentialId);
      await generateComplianceAlerts({ employerId });
    } catch (err: unknown) {
      console.error("[API][employer/credentials/[id]]", { credentialId, employerId, err });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[API][employer/credentials/[id]]", { err });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

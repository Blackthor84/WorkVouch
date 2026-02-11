import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { updateCredentialStatus } from "@/lib/credentials/statusUpdater";
import { generateComplianceAlerts } from "@/lib/compliance/generateAlerts";

/**
 * POST /api/employer/credentials — create professional credential
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sb = getSupabaseServer() as any;
    const { data: ea } = await sb.from("employer_accounts").select("id").eq("user_id", user.id);
    const account = Array.isArray(ea) ? ea[0] : ea;
    if (!account?.id) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;

    const body = await req.json();
    const userId = body.user_id as string;
    const credentialType = body.credential_type as string;
    const credentialName = body.credential_name as string;
    if (!userId || !credentialType || !credentialName) {
      return NextResponse.json(
        { error: "user_id, credential_type, and credential_name are required" },
        { status: 400 }
      );
    }

    const row = {
      user_id: userId,
      employer_id: employerId,
      credential_type: String(credentialType),
      credential_name: String(credentialName),
      issuing_authority: body.issuing_authority ?? null,
      credential_number: body.credential_number ?? null,
      issue_date: body.issue_date ?? null,
      expiration_date: body.expiration_date ?? null,
      document_url: body.document_url ?? null,
      verification_status: "pending",
      status: "active",
    };

    const { data: inserted, error } = await sb
      .from("professional_credentials")
      .insert(row)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const credentialId = (inserted as { id: string }).id;

    await updateCredentialStatus(credentialId).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
    await generateComplianceAlerts({ employerId }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });

    const { triggerProfileIntelligence, triggerEmployerIntelligence } = await import("@/lib/intelligence/engines");
    triggerProfileIntelligence(userId).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
    triggerEmployerIntelligence(employerId).catch((error) => { console.error("[SYSTEM_FAIL]", error); });

    return NextResponse.json({ id: credentialId });
  } catch (e) {
    console.error("Create credential error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

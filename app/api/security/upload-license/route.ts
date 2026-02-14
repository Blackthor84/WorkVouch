import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAuditAction } from "@/lib/audit";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { validateLicenseFormat } from "@/lib/security/licenseValidator";
import { generateComplianceAlerts } from "@/lib/security/complianceAlerts";
import { calculateCredentialScore } from "@/lib/security/credentialScore";

/**
 * POST /api/security/upload-license
 * Security Agency only. Body: license_number, state, license_type, issue_date, expiration_date, user_id (guard).
 * Optional: file (document). Validates format, auto-sets status=expired if past date, logs audit, generates alerts.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("plan_tier")
      .eq("user_id", user.id)
      .single();

    const planTier = (employerAccount?.plan_tier ?? "").toLowerCase().replace(/-/g, "_");
    if (planTier !== "security_agency" && planTier !== "security_bundle") {
      return NextResponse.json(
        { error: "Security Agency Bundle plan required" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const licenseNumber = (formData.get("license_number") as string) ?? "";
    const state = (formData.get("state") as string) ?? "";
    const licenseType = (formData.get("license_type") as string) ?? "license";
    const issueDate = (formData.get("issue_date") as string) ?? null;
    const expirationDate = (formData.get("expiration_date") as string) ?? null;
    const guardUserId = (formData.get("user_id") as string) ?? null;

    const validation = validateLicenseFormat(state, licenseNumber);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error ?? "Invalid license format" },
        { status: 400 }
      );
    }

    const adminSupabase = getSupabaseServer() as any;
    const { data: emp } = await adminSupabase.from("employer_accounts").select("id").eq("user_id", user.id).single();
    const employerId = (emp as { id?: string } | null)?.id ?? null;
    if (!employerId) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    const now = new Date().toISOString().slice(0, 10);
    let status: "active" | "expired" | "suspended" | "pending" = "active";
    if (expirationDate && expirationDate < now) status = "expired";

    const uploadedDocumentUrl = file?.name ? `uploads/${employerId}/${Date.now()}_${file.name}` : null;

    const res = await adminSupabase.from("guard_licenses").insert({
      employer_id: employerId,
      user_id: guardUserId || null,
      license_number: licenseNumber.trim() || null,
      state: state.trim() || null,
      license_type: licenseType || "license",
      issue_date: issueDate || null,
      expiration_date: expirationDate || null,
      status,
      uploaded_document_url: uploadedDocumentUrl,
    }).select("id").single();

    const inserted = (res as { data?: { id?: string } | null }).data;
    const licenseId = inserted?.id ?? null;

    await logAuditAction("license_uploaded", {
      admin_id: user.id,
      employer_id: employerId,
      profile_id: guardUserId ?? undefined,
      details: JSON.stringify({ license_id: licenseId, license_number: licenseNumber, state }),
    });

    try {
      await generateComplianceAlerts(employerId);
      if (guardUserId) await calculateCredentialScore(guardUserId);
    } catch (err: unknown) {
      console.error("[API][upload-license] compliance/credentialScore", { employerId, guardUserId, err });
    }

    return NextResponse.json({
      success: true,
      license: {
        id: licenseId,
        license_number: licenseNumber,
        state,
        license_type: licenseType,
        issue_date: issueDate,
        expiration_date: expirationDate,
        status,
        uploaded_document_url: uploadedDocumentUrl,
      },
    });
  } catch (err: unknown) {
    console.error("[API][upload-license]", { err });
    return NextResponse.json(
      { error: "Failed to upload license" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { hasRole } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * PATCH /api/employer/update-company
 * Employer only. Editable: company_name, contact_email.
 * Logs to admin_audit_logs with action "employer_update_company".
 */
export async function PATCH(request: Request) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Employer role required" }, { status: 403 });
    }

    const userId = session.user.id as string;
    const body = await request.json();
    const company_name = typeof body.company_name === "string" ? body.company_name.trim() : undefined;
    const contact_email = typeof body.contact_email === "string" ? body.contact_email.trim().toLowerCase() : undefined;

    if (company_name !== undefined && company_name.length < 2) {
      return NextResponse.json({ error: "company_name must be at least 2 characters" }, { status: 400 });
    }
    if (contact_email !== undefined && contact_email !== "" && !validateEmail(contact_email)) {
      return NextResponse.json({ error: "Invalid contact_email format" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    const { data: account, error: fetchErr } = await supabaseAny
      .from("employer_accounts")
      .select("id, user_id, company_name, contact_email")
      .eq("user_id", userId)
      .single();

    if (fetchErr || !account) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (company_name !== undefined) updates.company_name = company_name;
    if (contact_email !== undefined) updates.contact_email = contact_email || null;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const previous_value = { company_name: account.company_name, contact_email: account.contact_email ?? null };
    const { error: updateErr } = await supabaseAny
      .from("employer_accounts")
      .update(updates)
      .eq("id", account.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }

    const new_value = { company_name: company_name ?? account.company_name, contact_email: contact_email ?? account.contact_email ?? null };
    await supabaseAny.from("admin_audit_logs").insert({
      admin_id: userId,
      target_user_id: userId,
      action: "employer_update_company",
      old_value: previous_value,
      new_value,
      reason: "Employer company info update",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[employer/update-company]", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

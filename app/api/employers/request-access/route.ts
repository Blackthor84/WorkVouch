import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { SALES_EMAIL } from "@/lib/constants/contact";
import { sendEmail } from "@/lib/utils/sendgrid";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(s: unknown, max: number): string {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * POST /api/employers/request-access
 * Body: { fullName, company, email }
 * Persists lead and notifies sales (aggregated operational email; no PII in audit metadata).
 */
export async function POST(req: Request) {
  const rate = withRateLimit(req, {
    userId: null,
    prefix: "employer_access_req:",
    windowMs: 60_000,
    maxPerWindow: 5,
  });
  if (!rate.allowed) return rate.response;

  const body = await req.json().catch(() => ({}));
  const fullName = sanitize(body.fullName, 200);
  const company = sanitize(body.company, 200);
  const email = sanitize(body.email, 320).toLowerCase();

  if (!fullName || !company || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter your name, company, and a valid email." }, { status: 400 });
  }

  const { error } = await admin.from("employer_access_requests").insert({
    full_name: fullName,
    company_name: company,
    email,
    source: "employers_landing",
  });

  if (error) {
    console.error("[employers/request-access]", error.message);
    return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
  }

  await logAudit({
    action: "EMPLOYER_ACCESS_REQUEST",
    resource: "employers/request-access",
    metadata: { source: "employers_landing" },
  });

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:15px;">
  <p><strong>New employer access request</strong> (employers landing)</p>
  <p>Name: ${escapeHtml(fullName)}<br/>
  Company: ${escapeHtml(company)}<br/>
  Email: ${escapeHtml(email)}</p>
</body></html>`;
  await sendEmail(SALES_EMAIL, `[WorkVouch] Employer access: ${company}`, html);

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

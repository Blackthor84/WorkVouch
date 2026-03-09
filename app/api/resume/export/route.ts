// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/resume/export?profileId=xxx
 * Returns a PDF: Verified Resume — WorkVouch (name, verified jobs, confirmation count, trust score).
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getEffectiveUser } from "@/lib/auth";
import { calculateTrustScore } from "@/lib/trust/trustScore";
import { jsPDF } from "jspdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmploymentRow = {
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  verification_status: string;
};

export async function GET(request: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const isAdmin =
    effective.role === "admin" ||
    effective.role === "superadmin" ||
    effective.role === "super_admin";
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [profileRes, jobsRes, eventsRes, trustScore] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", profileId).maybeSingle(),
    admin
      .from("employment_records")
      .select("company_name, job_title, start_date, end_date, verification_status")
      .eq("user_id", profileId)
      .in("verification_status", ["verified", "matched"])
      .returns<EmploymentRow[]>(),
    admin
      .from("trust_events")
      .select("event_type")
      .eq("profile_id", profileId)
      .in("event_type", [
        "coworker_verified",
        "coworker_verification_confirmed",
        "employment_verified",
        "verification_confirmed",
      ])
      .returns<{ event_type: string }[]>(),
    calculateTrustScore(profileId),
  ]);

  type EventRow = { event_type: string };
  if (jobsRes.error) throw new Error(jobsRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);

  const name =
    (profileRes.data as { full_name?: string } | null)?.full_name ?? "—";
  const jobs: EmploymentRow[] = jobsRes.data ?? [];
  const events: EventRow[] = eventsRes.data ?? [];
  const confirmationCount = events.length;

  const pdf = new jsPDF();
  const title = "Verified Resume — WorkVouch";
  pdf.setFontSize(18);
  pdf.text(title, 20, 20);
  pdf.setFontSize(12);
  let y = 32;
  pdf.text(`Name: ${name}`, 20, y);
  y += 10;
  pdf.text(`Trust Score: ${trustScore}`, 20, y);
  y += 10;
  pdf.text(`Confirmation count: ${confirmationCount}`, 20, y);
  y += 14;
  pdf.text("Verified Jobs", 20, y);
  y += 8;
  for (const j of jobs) {
    const range = j.end_date ? `${j.start_date} – ${j.end_date}` : j.start_date + " – present";
    pdf.setFontSize(11);
    pdf.text(`${j.company_name} — ${j.job_title}`, 20, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.text(range, 24, y);
    y += 8;
  }

  const buf = Buffer.from(pdf.output("arraybuffer"));
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="verified-resume-workvouch-${profileId.slice(0, 8)}.pdf"`,
    },
  });
}

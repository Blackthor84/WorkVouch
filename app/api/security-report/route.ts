import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  SecurityReportSeverity,
  SecurityReportSeverityValue,
} from "@/lib/compliance-types";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reporterEmail: z.string().email(),
  description: z.string().min(10).max(10000),
  severity: z
    .enum([
      SecurityReportSeverity.low,
      SecurityReportSeverity.medium,
      SecurityReportSeverity.high,
      SecurityReportSeverity.critical,
    ] as [string, ...string[]])
    .optional()
    .default("medium"),
});

/**
 * POST /api/security-report
 * Submit a security report. No auth required (for external reporters).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sb = getSupabaseServer();
    const { data: row, error } = await sb
      .from("security_reports")
      .insert({
        reporter_email: parsed.data.reporterEmail,
        description: parsed.data.description,
        severity: parsed.data.severity as SecurityReportSeverityValue,
        status: "Open",
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      console.error("[api/security-report] insert error:", error);
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: row.id,
      status: row.status,
      message: "Report received. We will review it as soon as possible.",
    });
  } catch (e) {
    console.error("[api/security-report] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

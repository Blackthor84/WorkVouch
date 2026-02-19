/**
 * GET /api/admin/compliance/export?format=csv|pdf&organizationId=...
 * Admin-only. Super admin: all orgs or one; org admin: their org only. Enterprise plan required (Starter/Growth get 403 + upgrade CTA).
 * Exports: employee audit summary, reference verification status, org health snapshot. Logs every export.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getOrgHealthScore } from "@/lib/enterprise/orgHealthScore";
import { getOrgPlanLimits } from "@/lib/enterprise/orgPlanLimits";
import { planLimit403Response } from "@/lib/enterprise/checkOrgLimits";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

function normalizePlanKey(planType: string | null | undefined): string {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return "enterprise";
  return "starter";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminForApi();
    if (!admin) return adminForbiddenResponse();
    const { searchParams } = request.nextUrl;
    const format = searchParams.get("format")?.toLowerCase() === "pdf" ? "pdf" : "csv";
    const organizationId = searchParams.get("organizationId")?.trim() ?? null;

    const supabase = getSupabaseServer();

    let allowedOrgId: string | null = null;
    if (admin.isSuperAdmin) {
      allowedOrgId = organizationId;
    } else {
      if (!organizationId) {
        return NextResponse.json(
          { error: "Organization ID required for org-scoped export.", code: "ORG_REQUIRED" },
          { status: 400 }
        );
      }
      const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", admin.userId)
        .in("role", ["org_admin", "admin", "superadmin"])
        .maybeSingle();
      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden: You do not have access to this organization." },
          { status: 403 }
        );
      }
      allowedOrgId = organizationId;
    }

    if (!allowedOrgId) {
      return NextResponse.json(
        { error: "Specify organizationId for single-org export, or use superadmin to export all." },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan_type, name")
      .eq("id", allowedOrgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const planKey = normalizePlanKey((org as { plan_type?: string | null }).plan_type);
    if (planKey !== "enterprise") {
      const limits = getOrgPlanLimits((org as { plan_type?: string | null }).plan_type);
      return planLimit403Response(
        {
          allowed: false,
          error: "Compliance export is available on Enterprise plan.",
          planType: (org as { plan_type?: string | null }).plan_type,
        },
        "run_check",
        {
          status: "at_risk",
          recommended_plan: "enterprise",
        }
      );
    }

    const now = new Date().toISOString();
    const disclaimer = "This report is a point-in-time snapshot. Verification status may change. Generated at " + now + ".";

    const [health, workforce, auditScores, refCounts] = await Promise.all([
      getOrgHealthScore(allowedOrgId),
      supabase
        .from("workforce_employees")
        .select("id, full_name, email, profile_id")
        .eq("organization_id", allowedOrgId),
      supabase.from("employee_audit_scores").select("user_id, score, band, calculated_at"),
      supabase.from("user_references").select("to_user_id").eq("is_deleted", false),
    ]);

    const profileIds = ((workforce.data ?? []) as { profile_id: string | null }[])
      .map((r) => r.profile_id)
      .filter(Boolean) as string[];
    const refsByUser = new Map<string, number>();
    for (const r of (refCounts.data ?? []) as { to_user_id: string }[]) {
      refsByUser.set(r.to_user_id, (refsByUser.get(r.to_user_id) ?? 0) + 1);
    }
    const auditByUser = new Map(
      ((auditScores.data ?? []) as { user_id: string; score: number; band: string; calculated_at: string }[]).map((row) => [
        row.user_id,
        { score: row.score, band: row.band, calculated_at: row.calculated_at },
      ])
    );

    const rows: { name: string; email: string; profile_id: string; audit_score: number | null; audit_band: string; references_count: number }[] = [];
    for (const w of (workforce.data ?? []) as { full_name: string; email: string; profile_id: string | null }[]) {
      const pid = w.profile_id ?? "";
      const audit = auditByUser.get(pid);
      rows.push({
        name: w.full_name,
        email: w.email,
        profile_id: pid,
        audit_score: audit?.score ?? null,
        audit_band: audit?.band ?? "unverified",
        references_count: refsByUser.get(pid) ?? 0,
      });
    }

    await auditLog({
      actorUserId: admin.userId,
      actorRole: admin.role,
      action: "compliance_export",
      metadata: {
        organizationId: allowedOrgId,
        format,
        rowCount: rows.length,
        exportedAt: now,
      },
      ...getAuditMetaFromRequest(request),
    });

    if (format === "csv") {
      const header = "Name,Email,Profile ID,Audit Score,Audit Band,References Count";
      const body = rows
        .map((r) =>
          [r.name, r.email, r.profile_id, r.audit_score ?? "", r.audit_band, r.references_count].map((c) =>
            typeof c === "string" && (c.includes(",") || c.includes('"')) ? `"${c.replace(/"/g, '""')}"` : c
          ).join(",")
        )
        .join("\n");
      const csv = [
        "WorkVouch Compliance Export",
        "Organization: " + (org as { name?: string }).name,
        "Generated: " + now,
        disclaimer,
        "",
        header,
        body,
        "",
        "Org Health Score," + health.healthScore,
        "Org Health Status," + health.status,
        "Verified Employee %," + (health.verifiedEmployeePct ?? "n/a"),
        "Reference Completion %," + (health.referenceCompletionPct ?? "n/a"),
      ].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="compliance-export-${allowedOrgId.slice(0, 8)}-${now.slice(0, 10)}.csv"`,
        },
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Compliance Export</title></head>
<body style="font-family: sans-serif; padding: 20px;">
<h1>WorkVouch Compliance Export</h1>
<p><strong>Organization:</strong> ${(org as { name?: string }).name ?? allowedOrgId}</p>
<p><strong>Generated:</strong> ${now}</p>
<p>${disclaimer}</p>
<hr/>
<h2>Org Health Snapshot</h2>
<ul>
  <li>Health Score: ${health.healthScore}/100</li>
  <li>Status: ${health.status}</li>
  <li>Verified Employee %: ${health.verifiedEmployeePct ?? "n/a"}</li>
  <li>Reference Completion %: ${health.referenceCompletionPct ?? "n/a"}</li>
</ul>
<h2>Employee Audit Summary</h2>
<table border="1" cellpadding="4" cellspacing="0">
  <tr><th>Name</th><th>Audit Score</th><th>Audit Band</th><th>References</th></tr>
  ${rows.map((r) => `<tr><td>${r.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td><td>${r.audit_score ?? "—"}</td><td>${r.audit_band}</td><td>${r.references_count}</td></tr>`).join("")}
</table>
<p><em>End of report. Print to PDF if needed.</em></p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-export-${allowedOrgId.slice(0, 8)}-${now.slice(0, 10)}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden" || msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

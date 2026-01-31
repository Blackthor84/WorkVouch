import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getUsageForEmployer } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/employer-usage
 * List employer accounts with usage (admin/superadmin only).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as { roles?: string[] }).roles || [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employerId = req.nextUrl.searchParams.get("employerId");
    const supabase = getSupabaseServer() as any;

    if (employerId) {
      const usage = await getUsageForEmployer(employerId);
      if (!usage) {
        return NextResponse.json({ error: "Employer not found" }, { status: 404 });
      }
      const { data: account } = await supabase
        .from("employer_accounts")
        .select("id, company_name")
        .eq("id", employerId)
        .single();
      return NextResponse.json({
        ...usage,
        companyName: (account as { company_name?: string })?.company_name ?? null,
      });
    }

    const { data: accounts, error } = await supabase
      .from("employer_accounts")
      .select("id, company_name")
      .order("company_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (accounts as { id: string; company_name: string }[]) || [];
    let licenseCounts: Record<string, number> = {};
    let complianceCounts: Record<string, number> = {};
    let avgScores: Record<string, number | null> = {};
    try {
      const { data: gl } = await supabase.from("guard_licenses").select("employer_id, user_id");
      const glList = (gl ?? []) as { employer_id: string; user_id: string }[];
      for (const r of glList) {
        licenseCounts[r.employer_id] = (licenseCounts[r.employer_id] ?? 0) + 1;
      }
    } catch {
      // guard_licenses may not exist
    }
    try {
      const { data: alerts } = await supabase.from("compliance_alerts").select("employer_id").eq("resolved", false);
      const alertList = (alerts ?? []) as { employer_id: string }[];
      for (const a of alertList) {
        complianceCounts[a.employer_id] = (complianceCounts[a.employer_id] ?? 0) + 1;
      }
    } catch {
      // compliance_alerts may not exist
    }
    try {
      const { data: gl } = await supabase.from("guard_licenses").select("employer_id, user_id");
      const glList = (gl ?? []) as { employer_id: string; user_id: string }[];
      const userIdsByEmployer: Record<string, string[]> = {};
      for (const r of glList) {
        if (!userIdsByEmployer[r.employer_id]) userIdsByEmployer[r.employer_id] = [];
        if (r.user_id) userIdsByEmployer[r.employer_id].push(r.user_id);
      }
      for (const eid of Object.keys(userIdsByEmployer)) {
        const uids = [...new Set(userIdsByEmployer[eid])];
        if (uids.length === 0) {
          avgScores[eid] = null;
          continue;
        }
        const { data: prof } = await supabase.from("profiles").select("guard_credential_score").in("id", uids);
        const scores = (prof ?? []).map((p: { guard_credential_score?: number | null }) => p.guard_credential_score).filter((s): s is number => typeof s === "number");
        avgScores[eid] = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
      }
    } catch {
      // profiles.guard_credential_score may not exist
    }
    const withUsage = await Promise.all(
      list.map(async (acc) => {
        const usage = await getUsageForEmployer(acc.id);
        const limits = usage?.limits ?? { reports: 0, searches: 0, seats: 0 };
        const reportsCap = limits.reports === -1 ? Infinity : limits.reports;
        const searchesCap = limits.searches === -1 ? Infinity : limits.searches;
        const reportsOver = (usage?.reportsUsed ?? 0) > reportsCap;
        const searchesOver = (usage?.searchesUsed ?? 0) > searchesCap;
        return {
          employerId: acc.id,
          companyName: acc.company_name,
          planTier: usage?.planTier ?? "starter",
          stripeCustomerId: usage?.stripeCustomerId ?? null,
          stripeSubscriptionId: usage?.stripeSubscriptionId ?? null,
          reportsUsed: usage?.reportsUsed ?? 0,
          searchesUsed: usage?.searchesUsed ?? 0,
          seatsUsed: usage?.seatsUsed ?? 0,
          seatsAllowed: usage?.seatsAllowed ?? 1,
          limits: usage?.limits ?? null,
          overagesTriggered: reportsOver || searchesOver,
          licenseCount: licenseCounts[acc.id] ?? 0,
          complianceAlertCount: complianceCounts[acc.id] ?? 0,
          avgCredentialScore: avgScores[acc.id] ?? null,
        };
      })
    );

    return NextResponse.json(withUsage);
  } catch (err) {
    console.error("Admin employer-usage GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/employer-usage
 * Manual override: set reports_used, searches_used, or seats_used (admin/superadmin only).
 * Body: { employerId: string, reports_used?: number, searches_used?: number, seats_used?: number }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as { roles?: string[] }).roles || [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const employerId = body.employerId as string;
    if (!employerId) {
      return NextResponse.json({ error: "employerId required" }, { status: 400 });
    }

    const updates: Record<string, number> = {};
    if (typeof body.reports_used === "number") updates.reports_used = body.reports_used;
    if (typeof body.searches_used === "number") updates.searches_used = body.searches_used;
    if (typeof body.seats_used === "number") updates.seats_used = body.seats_used;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseServer() as any;
    const { error } = await supabase
      .from("employer_accounts")
      .update(updates)
      .eq("id", employerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin employer-usage PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

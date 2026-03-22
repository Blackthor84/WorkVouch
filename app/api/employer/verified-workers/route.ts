// IMPORTANT: All server routes use `admin` from @/lib/supabase-admin.

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import {
  normalizeEmployerMonetizationTier,
  getVerifiedWorkersCap,
  canUseLocationFilter,
  canUseJobTypeFilter,
  shouldHighlightTrusted,
  shouldSortByTrust,
} from "@/lib/employer/verifiedWorkersLimits";
import type { JobTypeFilter } from "@/lib/employer/jobTypeKeywords";
import { matchesJobTypeFilter } from "@/lib/employer/jobTypeKeywords";
import { vouchDisplayFromCount } from "@/lib/employer/vouchStatusDisplay";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  full_name: string | null;
  industry: string | null;
  restricted_from_employer_search?: boolean | null;
  role: string | null;
  vouch_count?: number | null;
  vouch_status?: string | null;
};

type JobRow = {
  user_id: string;
  company_name: string;
  job_title: string | null;
  title: string | null;
  start_date: string;
  is_private: boolean;
};

type LocRow = { user_id: string; state: string | null; country: string };

function locationLabel(country: string, state: string | null): string {
  if (country === "US" && state) return state;
  return country || "—";
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getCurrentUserProfile();
    const role = profile?.role ?? "";
    if (role !== "employer" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sb = admin as any;

    let monetizationTier = normalizeEmployerMonetizationTier("pro");
    if (role !== "superadmin") {
      const { data: acct } = await sb
        .from("employer_accounts")
        .select("plan_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      monetizationTier = normalizeEmployerMonetizationTier(
        (acct as { plan_tier?: string } | null)?.plan_tier
      );
    }

    const cap = getVerifiedWorkersCap(monetizationTier);
    const url = req.nextUrl;
    let stateFilter = (url.searchParams.get("state") || "NH").toUpperCase().slice(0, 2);
    let jobType = (url.searchParams.get("jobType") || "all").toLowerCase() as JobTypeFilter;
    if (!["all", "security", "hospitality", "healthcare"].includes(jobType)) {
      jobType = "all";
    }

    if (!canUseLocationFilter(monetizationTier)) {
      stateFilter = "NH";
    }
    if (!canUseJobTypeFilter(monetizationTier)) {
      jobType = "all";
    }

    const { data: locRows } = await sb
      .from("user_locations")
      .select("user_id, state, country")
      .eq("country", "US")
      .eq("state", stateFilter);

    const allowedIds = new Set(
      ((locRows ?? []) as LocRow[]).map((r) => r.user_id).filter(Boolean)
    );

    if (allowedIds.size === 0) {
      return NextResponse.json({
        workers: [],
        totalMatching: 0,
        monetizationTier,
        visibleCap: Number.isFinite(cap) ? cap : null,
        lockedCount: 0,
        filters: { state: stateFilter, jobType },
        messaging: {
          scarcity:
            "Most employers only see a small portion of verified workers. Upgrade to unlock full access.",
        },
      });
    }

    const idList = [...allowedIds];
    const chunkSize = 120;
    const profiles: ProfileRow[] = [];
    for (let i = 0; i < idList.length; i += chunkSize) {
      const chunk = idList.slice(i, i + chunkSize);
      const { data: profilesRaw, error: pErr } = await sb
        .from("profiles")
        .select(
          "id, full_name, industry, restricted_from_employer_search, role, vouch_count, vouch_status"
        )
        .in("id", chunk)
        .or("role.eq.candidate,role.eq.employee,role.eq.user,role.is.null");

      if (pErr) {
        console.error("[verified-workers]", pErr.message);
        return NextResponse.json({ error: "Failed to load workers" }, { status: 500 });
      }
      profiles.push(...((profilesRaw ?? []) as ProfileRow[]));
    }

    const profilesFiltered = profiles.filter(
      (p) => p.restricted_from_employer_search !== true
    );
    const ids = profiles.map((p) => p.id);
    if (!ids.length) {
      return NextResponse.json({
        workers: [],
        totalMatching: 0,
        monetizationTier,
        visibleCap: Number.isFinite(cap) ? cap : null,
        lockedCount: 0,
        filters: { state: stateFilter, jobType },
        messaging: {
          scarcity:
            "Most employers only see a small portion of verified workers. Upgrade to unlock full access.",
        },
      });
    }

    const { data: jobsRaw } = await sb
      .from("jobs")
      .select("user_id, company_name, job_title, title, start_date, is_private")
      .in("user_id", ids)
      .eq("is_private", false)
      .order("start_date", { ascending: false });

    const latestJobByUser: Record<string, { job_title: string; company_name: string }> = {};
    for (const j of (jobsRaw ?? []) as JobRow[]) {
      if (latestJobByUser[j.user_id]) continue;
      const title = (j.job_title || j.title || "").trim() || "Role not specified";
      latestJobByUser[j.user_id] = { job_title: title, company_name: j.company_name ?? "" };
    }

    const locByUser: Record<string, LocRow> = {};
    for (const r of (locRows ?? []) as LocRow[]) {
      if (!locByUser[r.user_id]) locByUser[r.user_id] = r;
    }

    type Built = {
      id: string;
      fullName: string;
      jobTitle: string;
      locationLabel: string;
      vouchCount: number;
      badge: string;
      statusLine: string;
      trustedHighlight: boolean;
    };

    const built: Built[] = [];
    for (const p of profilesFiltered) {
      const job = latestJobByUser[p.id];
      const jobTitle = job?.job_title ?? "—";
      if (!matchesJobTypeFilter(jobTitle, p.industry, jobType)) continue;

      const loc = locByUser[p.id];
      const vc = Math.max(0, Number(p.vouch_count ?? 0));
      const disp = vouchDisplayFromCount(vc);
      const highlight =
        shouldHighlightTrusted(monetizationTier) && vc >= 5;

      built.push({
        id: p.id,
        fullName: (p.full_name || "Worker").trim(),
        jobTitle,
        locationLabel: loc ? locationLabel(loc.country, loc.state) : stateFilter,
        vouchCount: vc,
        badge: disp.badge,
        statusLine: disp.statusLine,
        trustedHighlight: highlight,
      });
    }

    if (shouldSortByTrust(monetizationTier)) {
      built.sort((a, b) => b.vouchCount - a.vouchCount || a.fullName.localeCompare(b.fullName));
    } else {
      built.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    const totalMatching = built.length;
    const visibleCapNum = Number.isFinite(cap) ? cap : totalMatching;
    const MAX_LOCKED_PREVIEW = 12;
    const sliceLen = Number.isFinite(cap)
      ? Math.min(built.length, visibleCapNum + MAX_LOCKED_PREVIEW)
      : built.length;
    const visibleSlice = built.slice(0, sliceLen);

    const workers = visibleSlice.map((row, index) => {
      const locked = Number.isFinite(cap) && index >= visibleCapNum;
      if (locked) {
        return {
          id: `locked-${index}`,
          fullName: "Locked",
          jobTitle: "—",
          locationLabel: "—",
          vouchCount: 0,
          badge: "—",
          statusLine: "",
          trustedHighlight: false,
          locked: true,
        };
      }
      return { ...row, locked: false };
    });

    const lockedCount = Math.max(0, totalMatching - visibleCapNum);

    return NextResponse.json({
      workers,
      totalMatching,
      monetizationTier,
      visibleCap: Number.isFinite(cap) ? cap : null,
      lockedCount,
      filters: { state: stateFilter, jobType },
      messaging: {
        scarcity:
          "Most employers only see a small portion of verified workers. Upgrade to unlock full access.",
        unlock: "Unlock full access to verified workers",
      },
    });
  } catch (e) {
    console.error("[verified-workers]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

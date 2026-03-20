// GET /api/admin/control-center/reviews — super_admin. Unified employment + coworker references.

import { NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type UnifiedReview = {
  id: string;
  source: "employment" | "coworker";
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  flagged: boolean;
  reviewer_name: string | null;
  reviewed_name: string | null;
  reviewer_email: string | null;
  reviewed_email: string | null;
};

async function nameMap(ids: string[]) {
  const u = [...new Set(ids.filter(Boolean))];
  if (!u.length) return new Map<string, { full_name: string | null; email: string | null }>();
  const { data } = await admin.from("profiles").select("id, full_name, email").in("id", u);
  const m = new Map<string, { full_name: string | null; email: string | null }>();
  for (const p of data ?? []) {
    m.set(p.id, { full_name: p.full_name, email: p.email });
  }
  return m;
}

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const [empRes, cowRes] = await Promise.all([
      admin
        .from("employment_references")
        .select("id, reviewer_id, reviewed_user_id, rating, comment, created_at, flagged")
        .order("created_at", { ascending: false })
        .limit(150),
      admin
        .from("coworker_references")
        .select("id, reviewer_id, reviewed_id, rating, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(150),
    ]);

    const items: UnifiedReview[] = [];
    const ids: string[] = [];

    if (!empRes.error && empRes.data) {
      for (const r of empRes.data) {
        ids.push(r.reviewer_id, r.reviewed_user_id);
        items.push({
          id: r.id,
          source: "employment",
          reviewer_id: r.reviewer_id,
          reviewed_user_id: r.reviewed_user_id,
          rating: Number(r.rating),
          comment: r.comment ?? null,
          created_at: r.created_at ?? null,
          flagged: Boolean(r.flagged),
          reviewer_name: null,
          reviewed_name: null,
          reviewer_email: null,
          reviewed_email: null,
        });
      }
    }

    if (!cowRes.error && cowRes.data) {
      for (const r of cowRes.data) {
        ids.push(r.reviewer_id, r.reviewed_id);
        items.push({
          id: r.id,
          source: "coworker",
          reviewer_id: r.reviewer_id,
          reviewed_user_id: r.reviewed_id,
          rating: Number(r.rating),
          comment: r.comment ?? null,
          created_at: r.created_at ?? null,
          flagged: false,
          reviewer_name: null,
          reviewed_name: null,
          reviewer_email: null,
          reviewed_email: null,
        });
      }
    }

    items.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    const m = await nameMap(ids);
    for (const it of items) {
      it.reviewer_name = m.get(it.reviewer_id)?.full_name ?? null;
      it.reviewed_name = m.get(it.reviewed_user_id)?.full_name ?? null;
      it.reviewer_email = m.get(it.reviewer_id)?.email ?? null;
      it.reviewed_email = m.get(it.reviewed_user_id)?.email ?? null;
    }

    return NextResponse.json({ reviews: items.slice(0, 200) });
  } catch (e) {
    console.warn("[control-center/reviews GET]", e);
    return NextResponse.json({ reviews: [] });
  }
}

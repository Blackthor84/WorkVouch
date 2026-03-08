/**
 * GET /api/employer/resolve-name?q=<name> — Fuzzy employer name resolution.
 * Returns matches with confidence scores. Never auto-verify on name match alone.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveEmployerNameFromRows, type EmployerAccountRow } from "@/lib/employer-resolution/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[AUTH]", { route: "/api/employer/resolve-name", reason: "unauthenticated" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ query: "", matches: [], suggestedMatch: null });
    }

    type EmployerRow = { id: string; company_name: string | null };
    const { data: rows } = await admin
      .from("employer_accounts")
      .select("id, company_name")
      .ilike("company_name", `%${q}%`)
      .limit(20)
      .returns<EmployerRow[]>();

    const list: EmployerAccountRow[] = (rows ?? []).map((r) => ({
      id: r.id,
      company_name: r.company_name ?? "",
    }));
    const result = resolveEmployerNameFromRows(q, list);

    return NextResponse.json(result);
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

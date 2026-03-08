// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/trust/coverage
 * Returns verified employment coverage for the current user.
 * Formula: coveragePercent = (verifiedRoles / totalRoles) * 100 when totalRoles > 0; else 0.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustCoverageResponse = {
  coveragePercent: number;
  verifiedRoles: number;
  totalRoles: number;
};

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: rows, error } = await admin.from("employment_records")
    .select("verification_status")
    .eq("user_id", effective.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as { verification_status?: string }[];
  const totalRoles = list.length;
  const verifiedRoles = list.filter((r) => r.verification_status === "verified").length;
  const coveragePercent =
    totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0;

  const response: TrustCoverageResponse = {
    coveragePercent,
    verifiedRoles,
    totalRoles,
  };

  return NextResponse.json(response);
}

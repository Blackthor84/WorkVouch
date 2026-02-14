import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")?.trim() || undefined;
  const organizationId = url.searchParams.get("organizationId")?.trim() || undefined;
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
  const sb = getSupabaseServer();
  let query = sb.from("resumes").select("id, user_id, organization_id, file_path, status, parsed_data, parsing_error, created_at").order("created_at", { ascending: false }).limit(limit);
  if (userId) query = query.eq("user_id", userId);
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to list resumes" }, { status: 500 });
  return NextResponse.json({ resumes: data ?? [] });
}

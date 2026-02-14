/**
 * POST /api/admin/preview-links/create
 * Superadmin only. Creates a shareable preview link (preview_sessions).
 */
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/roles";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function secureToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isSuperAdmin(role)) return NextResponse.json({ error: "Forbidden: superadmin only" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const previewRole = (body?.preview_role as string) || "employer";
    const previewPlan = (body?.preview_plan as string) || "pro";
    const previewFeatures = Array.isArray(body?.preview_features)
      ? body.preview_features
      : (typeof body?.preview_features === "object" && body.preview_features !== null
        ? Object.keys(body.preview_features).filter((k: string) => (body.preview_features as Record<string, boolean>)[k])
        : []);
    const expiresInMinutes = typeof body?.expires_in_minutes === "number" ? Math.min(10080, Math.max(15, body.expires_in_minutes)) : 60;
    const createdBy = user.id;

    const token = secureToken();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const supabase = getSupabaseServer() as any;
    const { data: row, error } = await supabase
      .from("preview_sessions")
      .insert({
        token,
        preview_role: previewRole,
        preview_plan: previewPlan,
        preview_features: previewFeatures,
        expires_at: expiresAt,
        created_by: createdBy,
      })
      .select("id, token, expires_at")
      .single();

    if (error) {
      console.error("Preview link create error:", error);
      return NextResponse.json({ error: "Failed to create preview session" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") || "https://workvouch.com";
    const url = `${baseUrl}/preview/${(row as { token: string }).token}`;

    return NextResponse.json({
      id: (row as { id: string }).id,
      token: (row as { token: string }).token,
      expires_at: (row as { expires_at: string }).expires_at,
      url,
    });
  } catch (e) {
    console.error("Preview link create error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

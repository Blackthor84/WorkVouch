import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type NormalizedRole = "user" | "employer" | "admin" | "superadmin";

function normalizeRole(raw: string | null | undefined): NormalizedRole {
  const r = (raw ?? "").trim().toLowerCase();
  if (r === "superadmin") return "superadmin";
  if (r === "admin") return "admin";
  if (r === "employer") return "employer";
  return "user";
}

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const authResult = await supabase.auth.getUser();

    if (authResult.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.data?.user;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAny = supabase as any;
    const profileResult = await supabaseAny
      .from("profiles")
      .select("id, email, role, onboarding_completed")
      .eq("id", user.id)
      .limit(1);

    if (profileResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    const rows = profileResult.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = rows[0] as { id?: string; email?: string | null; role?: string | null; onboarding_completed?: boolean };
    return NextResponse.json({
      id: row.id ?? user.id,
      email: row.email ?? user.email ?? null,
      role: normalizeRole(row.role),
      onboarding_complete: Boolean(row.onboarding_completed),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

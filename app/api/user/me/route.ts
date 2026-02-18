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
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAny = supabase as any;
    const { data: profile, error: profileError } = await supabaseAny
      .from("profiles")
      .select("id, email, role, onboarding_completed")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    if (profile) {
      const row = profile as { id?: string; email?: string | null; role?: string | null; onboarding_completed?: boolean };
      return NextResponse.json({
        id: row.id ?? authUser.id,
        email: row.email ?? authUser.email ?? null,
        role: normalizeRole(row.role),
        onboarding_complete: Boolean(row.onboarding_completed),
      });
    }

    return NextResponse.json({
      id: authUser.id,
      email: authUser.email ?? null,
      role: "user" as NormalizedRole,
      onboarding_complete: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

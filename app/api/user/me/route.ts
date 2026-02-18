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
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = profile as { id?: string; email?: string | null; role?: string | null; onboarding_completed?: boolean };
    const id = row.id ?? authUser.id;
    const email = row.email ?? authUser.email ?? null;
    const role = normalizeRole(row.role);
    const onboarding_complete = Boolean(row.onboarding_completed);

    return NextResponse.json({
      id,
      email,
      role,
      onboarding_complete,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

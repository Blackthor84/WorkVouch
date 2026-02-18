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
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = data.user;

    const { data: rows, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, onboarding_completed")
      .eq("id", user.id)
      .limit(1);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = rows[0];

    return NextResponse.json({
      id: row.id,
      email: user.email ?? null,
      role: normalizeRole(row.role),
      onboarding_complete: Boolean(row.onboarding_completed),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

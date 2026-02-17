import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileAny = profile as {
      visibility?: string;
      is_public_passport?: boolean;
      searchable_by_verified_employers?: boolean;
      searchable_by_shared_employers?: boolean;
      email_verified?: boolean;
    };
    const supabase = await supabaseServer();
    const supabaseAny = supabase as any;
    const { data: profileRow } = await supabaseAny
      .from("profiles")
      .select("email_verified")
      .eq("id", user.id)
      .single();
    const emailVerified = (profileRow as { email_verified?: boolean } | null)?.email_verified !== false;

    return NextResponse.json({
      id: profile.id,
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        industry: profile.industry,
        currentEmployerHidden: true,
        createdAt: profile.created_at,
      },
      profile: {
        visibility: profileAny.visibility ?? "private",
        is_public_passport: profileAny.is_public_passport ?? false,
        searchable_by_verified_employers: profileAny.searchable_by_verified_employers ?? true,
        searchable_by_shared_employers: profileAny.searchable_by_shared_employers ?? true,
        email_verified: emailVerified,
      },
      role: profile.role ?? null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

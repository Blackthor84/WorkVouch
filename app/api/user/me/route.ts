import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getCurrentUserProfile();
    const roles = await getCurrentUserRoles();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        industry: profile.industry,
        currentEmployerHidden: true, // Default for now
        createdAt: profile.created_at,
      },
      roles: roles || [],
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

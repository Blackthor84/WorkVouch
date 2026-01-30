import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type Profile = {
  id: string;
  email: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = session.user.roles || [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const userId = typeof body?.userId === "string" ? body.userId.trim() : null;
    if (!userId) {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .single<Profile>();

    if (error || !profile) {
      return new Response("Profile not found", { status: 404 });
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      return NextResponse.json(
        { error: "Failed to fetch target user roles" },
        { status: 500 }
      );
    }

    const targetRoles: string[] = (rolesData || []).map((r: { role: string }) => r.role);

    if (targetRoles.includes("superadmin")) {
      return NextResponse.json(
        { error: "Cannot impersonate another superadmin" },
        { status: 403 }
      );
    }

    const isTargetAdmin = targetRoles.includes("admin") || targetRoles.includes("superadmin");
    const isTargetBeta = targetRoles.includes("beta");
    const isTargetEmployer = targetRoles.includes("employer");
    const role = isTargetBeta
      ? "beta"
      : isTargetAdmin
        ? "admin"
        : isTargetEmployer
          ? "employer"
          : "user";

    const impersonateUser = {
      id: profile.id,
      email: profile.email ?? "",
      role,
      roles: targetRoles,
    };

    // Optional: log impersonation if admin_actions table exists
    try {
      await supabase.from("admin_actions").insert({
        admin_id: session.user.id,
        impersonated_user_id: userId,
        action_type: "impersonate",
      });
    } catch {
      // Table may not exist; ignore
    }

    return NextResponse.json({ impersonateUser });
  } catch (error: unknown) {
    console.error("Impersonate API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
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

    const supabase = getSupabaseServer();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching user_roles:", rolesError);
      return NextResponse.json(
        { error: rolesError.message },
        { status: 500 }
      );
    }

    type RoleRow = {
      user_id: string;
      role: string;
    };

    const rolesByUserId = ((rolesData || []) as RoleRow[]).reduce<
      Record<string, string[]>
    >((acc, row) => {
      if (!acc[row.user_id]) {
        acc[row.user_id] = [];
      }
      acc[row.user_id].push(row.role);
      return acc;
    }, {});

    const users = (profiles || []).map((p) => ({
      id: p.id,
      email: p.email ?? "",
      full_name: p.full_name ?? "",
      roles: rolesByUserId[p.id] ?? [],
      created_at: p.created_at,
    }));

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

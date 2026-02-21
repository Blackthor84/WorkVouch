import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function POST(req: Request) {
  try {
    if (process.env.SANDBOX_IMPERSONATION_ENABLED !== "true") {
      return NextResponse.json({ error: "Impersonation is disabled" }, { status: 403 });
    }

    const forbidden = await requireSuperadmin();
    if (forbidden) return forbidden;

    const body = await req.json();
    const { id, type, name, sandboxId } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid id" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .single();

    const role = (profile as { role?: string } | null)?.role?.toLowerCase();
    if (role === "admin" || role === "superadmin" || role === "super_admin") {
      return NextResponse.json(
        { error: "Workers only; cannot impersonate admins" },
        { status: 400 }
      );
    }

    // Write impersonation cookie (HTTP-only)
    const cookieStore = await cookies();
    cookieStore.set(
      "sandbox_playground_impersonation",
      JSON.stringify({
        id,
        type: type === "employer" ? "employer" : "employee",
        name: name ?? null,
        sandboxId: sandboxId ?? null,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    );

    // 5️⃣ Success
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("IMPERSONATE ERROR:", err);
    return NextResponse.json(
      { error: "Impersonation failed" },
      { status: 400 }
    );
  }
}

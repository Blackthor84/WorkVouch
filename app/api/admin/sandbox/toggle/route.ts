import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/lib/admin/requireAdmin";

export async function POST() {
  await requireSuperAdmin();

  const cookieStore = await cookies();
  const current = cookieStore.get("sandbox_mode")?.value === "true";

  cookieStore.set("sandbox_mode", (!current).toString(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({
    sandbox: !current,
  });
}

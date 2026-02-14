import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export async function POST() {
  const _session = await requireSuperAdminForApi();
  if (!_session) return adminForbiddenResponse();

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

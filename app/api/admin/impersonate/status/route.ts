import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ImpersonationSession = {
  adminId: string;
  impersonatedUserId: string;
  startedAt: number;
};

/** GET /api/admin/impersonate/status — returns active session from impersonation_session cookie. */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("impersonation_session")?.value?.trim();

  if (!raw) {
    return NextResponse.json({ active: false, impersonating: false });
  }

  try {
    const session = JSON.parse(raw) as ImpersonationSession;
    return NextResponse.json({
      active: true,
      impersonating: true,
      impersonatedUserId: session.impersonatedUserId ?? raw,
      startedAt: session.startedAt ?? null,
    });
  } catch {
    return NextResponse.json({
      active: true,
      impersonating: true,
      impersonatedUserId: raw,
      startedAt: null,
    });
  }
}

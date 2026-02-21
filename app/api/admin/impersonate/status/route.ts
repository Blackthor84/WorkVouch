import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

const IMPERSONATE_USER_COOKIE = "impersonate_user";
const WORKVOUCH_IMPERSONATION_COOKIE = "workvouch_impersonation";

/** GET /api/admin/impersonate/status — returns { impersonating: true } when admin is viewing as another user. */
export async function GET() {
  try {
    const authed = await getAuthedUser();
    const isAdmin = authed?.role === "admin" || authed?.role === "superadmin";
    if (!isAdmin) {
      return NextResponse.json({ impersonating: false });
    }

    const cookieStore = await cookies();
    const impersonateUser = cookieStore.get(IMPERSONATE_USER_COOKIE)?.value?.trim();
    if (impersonateUser) {
      return NextResponse.json({ impersonating: true });
    }

    const token = cookieStore.get(WORKVOUCH_IMPERSONATION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ impersonating: false });
    }
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "impersonation-secret"
    );
    await jwtVerify(token, secret);
    return NextResponse.json({ impersonating: true });
  } catch {
    return NextResponse.json({ impersonating: false });
  }
}

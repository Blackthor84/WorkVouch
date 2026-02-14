import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const IMPERSONATION_COOKIE = "workvouch_impersonation";
const COOKIE_MAX_AGE = 30 * 60; // 30 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.impersonationToken === "string" ? body.impersonationToken.trim() : null;
    const impersonateUser = body?.impersonateUser;

    if (!token) {
      return NextResponse.json({ error: "Missing impersonationToken" }, { status: 400 });
    }

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "impersonation-secret"
    );
    await jwtVerify(token, secret);

    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      impersonateUser: impersonateUser ?? undefined,
    });
  } catch (e) {
    console.error("Impersonate set error:", e);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
}

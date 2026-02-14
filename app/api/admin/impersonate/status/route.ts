import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const IMPERSONATION_COOKIE = "workvouch_impersonation";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
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

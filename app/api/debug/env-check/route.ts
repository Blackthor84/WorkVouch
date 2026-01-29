import { NextRequest, NextResponse } from "next/server";

/**
 * Temporary debug route: environment verification for production (Vercel).
 * Does NOT return actual secret values. Only booleans, lengths, and safe metadata.
 */

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
  let nextAuthUrlMatchesHost = false;
  if (nextAuthUrl && host) {
    try {
      const urlOrigin = new URL(nextAuthUrl).origin;
      const requestOrigin = request.headers.get("x-forwarded-proto")
        ? `${request.headers.get("x-forwarded-proto")}://${host}`
        : `https://${host}`;
      nextAuthUrlMatchesHost = urlOrigin === new URL(requestOrigin).origin;
    } catch {
      nextAuthUrlMatchesHost = false;
    }
  }

  const body = {
    NODE_ENV: process.env.NODE_ENV ?? null,
    host,
    NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length ?? 0,
    NEXTAUTH_URL: nextAuthUrl || null,
    NEXTAUTH_URL_matches_host: nextAuthUrlMatchesHost,
    NEXT_PUBLIC_SUPABASE_URL_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL_length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length ?? 0,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
    SUPABASE_SERVICE_ROLE_KEY_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
  };

  return NextResponse.json(body);
}

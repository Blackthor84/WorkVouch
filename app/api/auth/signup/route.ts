import { NextRequest, NextResponse } from "next/server";


export const runtime = "nodejs";
/**
 * Legacy signup route - not used
 * The app uses Supabase Auth directly via components/sign-up-form.tsx
 * This route is kept for backward compatibility but returns not implemented
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This signup endpoint is not implemented. Please use Supabase Auth signup via the signup form.",
      message:
        "Use the signup form at /signup which uses Supabase Auth directly.",
    },
    { status: 501 }, // 501 Not Implemented
  );
}

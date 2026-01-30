import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { checkFeatureAccess } from "@/lib/feature-flags";
import { NextResponse } from "next/server";

/**
 * GET /api/feature-flags/check?key=<feature_key>
 * Returns { enabled: boolean } for the current user.
 * Wraps checkFeatureAccess; used by useFeatureFlag hook.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ enabled: false }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    let employerId: string | null = null;
    const supabase = getSupabaseServer() as any;
    const { data: employer } = await supabase
      .from("employer_accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (employer?.id) employerId = employer.id;

    const enabled = await checkFeatureAccess(key, {
      userId,
      employerId,
      uiOnly: true,
    });

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Feature flag check error:", error);
    return NextResponse.json({ enabled: false }, { status: 200 });
  }
}
